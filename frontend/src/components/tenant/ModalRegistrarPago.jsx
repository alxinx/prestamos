import { useEffect, useState } from 'react'
import Modal from './Modal'
import CampoMoneda from './CampoMoneda'
import CampoFormulario, { claseInput } from './CampoFormulario'
import BotonAccion from './BotonAccion'
import ModalConfirmacion from './ModalConfirmacion'
import { IcoMoneda, IcoDescargar } from './iconos'
import { formatearPrecio } from '../../lib/formato'
import { apiFetch } from '../../lib/api'

const METODOS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'NEQUI', label: 'Nequi' },
  { value: 'DAVIPLATA', label: 'Daviplata' },
  { value: 'OTRO', label: 'Otro' },
]

function abrirVoucher(base64) {
  const bytes = atob(base64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  const blob = new Blob([arr], { type: 'application/pdf' })
  window.open(URL.createObjectURL(blob), '_blank', 'noopener,noreferrer')
}

// Modal de registro de abonos — el orden de aplicación (recargos → interés →
// capital, cuota por cuota, de más antigua a más reciente) lo decide siempre
// el backend; acá solo se MUESTRA el resultado en vivo (POST /pagos/simular,
// debounced) antes de confirmar. Todo abono se aplica de inmediato al
// registrarse (ya no hay paso de liquidación aparte, decisión del usuario
// 2026-07-23) y genera su comprobante ahí mismo.
export default function ModalRegistrarPago({ credito, onCerrar, onRegistrar }) {
  // Arranca en lo que el cliente necesita para quedar al día (recargos +
  // cuotas vencidas sin pagar, credito.montoSugerido = "Mora acumulada" del
  // detalle) en vez de 0 — el operador lo ajusta si el cliente paga otro
  // monto. Si no hay nada vencido, arranca en 0 como antes.
  const [monto, setMonto] = useState(Number(credito.montoSugerido) || 0)
  const [metodoPago, setMetodoPago] = useState('EFECTIVO')
  const [sobranteDestino, setSobranteDestino] = useState(null)
  const [simulacion, setSimulacion] = useState(null)
  const [simulando, setSimulando] = useState(false)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [voucherListo, setVoucherListo] = useState(null)
  const [quedoPendiente, setQuedoPendiente] = useState(false)

  useEffect(() => {
    setSobranteDestino(null)
  }, [monto])

  useEffect(() => {
    if (!(Number(monto) > 0)) {
      setSimulacion(null)
      return
    }

    let vigente = true
    setSimulando(true)
    const idTimeout = setTimeout(async () => {
      const { ok, datos } = await apiFetch('/api/tenant/pagos/simular', {
        method: 'POST',
        body: { creditoId: credito.id, montoRecibido: Number(monto), sobranteDestino: sobranteDestino ?? undefined },
      })
      if (!vigente) return
      if (ok) setSimulacion(datos)
      setSimulando(false)
    }, 400)

    return () => { vigente = false; clearTimeout(idTimeout) }
  }, [monto, sobranteDestino, credito.id])

  const formValido = Number(monto) > 0 && !!metodoPago && simulacion && !simulacion.requiereDecisionSobrante

  function pedirConfirmacion() {
    if (!formValido) return
    setError('')
    setConfirmando(true)
  }

  async function guardar() {
    setConfirmando(false)
    setGuardando(true)
    setError('')
    try {
      const { ok, datos } = await onRegistrar({
        creditoId: credito.id, montoRecibido: Number(monto), metodoPago,
        sobranteDestino: sobranteDestino ?? undefined,
      })
      if (!ok) {
        setError(datos.error || 'No se pudo registrar el pago. Intenta nuevamente.')
        return
      }
      if (datos.pago?.voucherPdfBase64) setVoucherListo(datos.pago.voucherPdfBase64)
      else if (datos.pago?.estado === 'PENDIENTE_LIQUIDAR') setQuedoPendiente(true)
      else onCerrar()
    } catch (err) {
      setError(err.message || 'No se pudo registrar el pago. Intenta nuevamente.')
    } finally {
      setGuardando(false)
    }
  }

  // Tras registrar con éxito, se muestra el comprobante en vez de cerrar de
  // una — el operador decide cuándo cerrar.
  if (voucherListo) {
    return (
      <Modal
        titulo="Pago registrado"
        subtitulo={`Crédito de ${credito.clienteNombre}`}
        onCerrar={onCerrar}
        ancho="400px"
        footer={
          <div className="flex gap-2.5">
            <button
              onClick={onCerrar}
              className="flex-1 py-2.5 rounded-lg bg-surface-default border border-outline-variant text-on-surface-variant text-[13px] font-medium cursor-pointer hover:bg-surface-high transition-colors"
            >
              Cerrar
            </button>
            <BotonAccion type="button" onClick={() => abrirVoucher(voucherListo)} icono={<IcoDescargar size={14} />} className="flex-1">
              Ver comprobante
            </BotonAccion>
          </div>
        }
      >
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-secondary-container/25 text-secondary flex items-center justify-center mx-auto mb-3">
            <IcoMoneda size={22} />
          </div>
          <p className="text-[14px] text-on-background font-semibold m-0">El abono quedó registrado y aplicado.</p>
          <p className="text-[13px] text-on-surface-variant m-0 mt-1">Su comprobante ya está listo para descargar.</p>
        </div>
      </Modal>
    )
  }

  // Modo producción (PAGOS_REQUIERE_LIQUIDACION=true): el pago queda
  // PENDIENTE_LIQUIDAR — no afecta la caja ni el saldo del crédito todavía
  // (CLAUDE.md §7), así que todavía no hay comprobante que mostrar; se genera
  // recién cuando un administrador lo liquide desde "Pagos realizados".
  if (quedoPendiente) {
    return (
      <Modal
        titulo="Pago registrado"
        subtitulo={`Crédito de ${credito.clienteNombre}`}
        onCerrar={onCerrar}
        ancho="400px"
        footer={
          <BotonAccion type="button" onClick={onCerrar} className="w-full">
            Entendido
          </BotonAccion>
        }
      >
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-secondary-container/25 text-secondary flex items-center justify-center mx-auto mb-3">
            <IcoMoneda size={22} />
          </div>
          <p className="text-[14px] text-on-background font-semibold m-0">El abono quedó registrado.</p>
          <p className="text-[13px] text-on-surface-variant m-0 mt-1">
            Queda pendiente de liquidar — todavía no afecta el saldo del crédito ni la caja. Su comprobante se genera al liquidarlo.
          </p>
        </div>
      </Modal>
    )
  }

  return (
    <>
      <Modal
        titulo="Registrar pago"
        subtitulo={`Crédito de ${credito.clienteNombre}`}
        onCerrar={onCerrar}
        ancho="440px"
        footer={
          <>
            {error && (
              <p className="text-[13px] text-on-error-container bg-error-container rounded-lg px-3 py-2">{error}</p>
            )}
            <div className="flex gap-2.5">
              <button
                onClick={onCerrar}
                className="flex-1 py-2.5 rounded-lg bg-surface-default border border-outline-variant text-on-surface-variant text-[13px] font-medium cursor-pointer hover:bg-surface-high transition-colors"
              >
                Cancelar
              </button>
              <BotonAccion
                type="button"
                onClick={pedirConfirmacion}
                disabled={guardando || !formValido}
                cargando={guardando}
                icono={<IcoMoneda size={14} />}
                className="flex-1"
              >
                {guardando ? 'Guardando...' : 'Registrar pago'}
              </BotonAccion>
            </div>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <CampoMoneda etiqueta="Monto recibido" valor={monto} onChange={setMonto} />

          <CampoFormulario etiqueta="Método de pago">
            <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)} className={claseInput}>
              {METODOS_PAGO.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </CampoFormulario>

          {Number(monto) > 0 && (
            <div className="rounded-xl border border-outline-variant/50 bg-surface-default p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant mb-2.5">
                Así se va a aplicar (recargos → interés → capital)
              </p>
              {simulando ? (
                <p className="text-[13px] text-on-surface-variant m-0">Calculando...</p>
              ) : !simulacion ? (
                <p className="text-[13px] text-on-surface-variant m-0">No se pudo calcular el reparto.</p>
              ) : simulacion.requiereDecisionSobrante ? (
                <div>
                  <p className="text-[13px] text-on-background m-0 mb-3">
                    Sobran <strong>{formatearPrecio(simulacion.sobrante)}</strong> después de cubrir lo que este crédito tiene pendiente hoy. ¿Cómo se aplica el resto?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSobranteDestino('CAPITAL')}
                      className="py-2.5 px-2 rounded-lg border-2 border-outline-variant bg-surface-lowest text-[12.5px] font-semibold text-on-background cursor-pointer hover:border-primary transition-colors"
                    >
                      Abonar a capital
                    </button>
                    <button
                      type="button"
                      onClick={() => setSobranteDestino('PROXIMAS_CUOTAS')}
                      className="py-2.5 px-2 rounded-lg border-2 border-outline-variant bg-surface-lowest text-[12.5px] font-semibold text-on-background cursor-pointer hover:border-primary transition-colors"
                    >
                      Abonar a próximas cuotas
                    </button>
                  </div>
                </div>
              ) : simulacion.aplicacionPorCuota.length === 0 ? (
                <p className="text-[13px] text-on-surface-variant m-0">Este crédito no tiene saldo pendiente.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {simulacion.aplicacionPorCuota.map((c, i) => (
                    <div key={i} className={i > 0 ? 'pt-3 border-t border-outline-variant/40' : ''}>
                      {c.numero != null && (
                        <p className="text-[12px] font-semibold text-on-background m-0 mb-1">Cuota N°{c.numero}</p>
                      )}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="text-on-surface-variant">Recargos</span>
                          <span className="font-semibold text-on-background">{formatearPrecio(c.valorRecargos)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="text-on-surface-variant">Interés</span>
                          <span className="font-semibold text-on-background">{formatearPrecio(c.valorIntereses)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="text-on-surface-variant">Capital</span>
                          <span className="font-semibold text-on-background">{formatearPrecio(c.valorCapital)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {sobranteDestino && (
                    <p className="text-[11.5px] text-secondary font-semibold m-0 pt-1">
                      Sobrante aplicado a {sobranteDestino === 'CAPITAL' ? 'capital' : 'próximas cuotas'}.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {confirmando && (
        <ModalConfirmacion
          tipo="confirmacion"
          titulo="¿Registrar este pago?"
          mensaje={
            <div className="text-left flex flex-col gap-1">
              <p className="m-0"><strong>Monto:</strong> {formatearPrecio(monto)}</p>
              <p className="m-0"><strong>Método:</strong> {METODOS_PAGO.find(m => m.value === metodoPago)?.label}</p>
              <p className="m-0 mt-2 text-[12px]">Se aplica de inmediato y genera su comprobante.</p>
            </div>
          }
          textoConfirmar="Sí, registrar"
          onConfirmar={guardar}
          onCancelar={() => setConfirmando(false)}
        />
      )}
    </>
  )
}
