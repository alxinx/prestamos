import { useEffect, useState } from 'react'
import TarjetaPanel from '../../components/tenant/TarjetaPanel'
import TarjetaStat from '../../components/tenant/TarjetaStat'
import ChipEstado from '../../components/tenant/ChipEstado'
import ModalConfirmacion from '../../components/tenant/ModalConfirmacion'
import ModalConfirmarContrasena from '../../components/tenant/ModalConfirmarContrasena'
import ModalAjustarCapital from '../../components/tenant/ModalAjustarCapital'
import { IcoEdificio, IcoPausa, IcoPlay, IcoMoneda, IcoImprimir } from '../../components/tenant/iconos'
import usePermisos from '../../hooks/usePermisos'
import { formatearPrecio, formatearFecha } from '../../lib/formato'
import { inicialesDe, claseAvatar } from '../../lib/avatar'
import { apiFetch } from '../../lib/api'
import { abrirTirillaAjusteCapital, escribirTirillaAjusteCapital } from '../../lib/tirillaCapital'

function idDeUrl() {
  const partes = window.location.pathname.split('/')
  return partes[2] // /capital/:id/panel
}

function IcoFlechaAbajo() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
    </svg>
  )
}

function IcoFlechaArriba() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
    </svg>
  )
}

function IcoHistorial() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

// Ícono neutral para movimientos "evento" (suspensión/reactivación) — no mueven
// dinero, así que no llevan flecha de entrada/salida como los demás.
function IcoEvento() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function IcoAlerta() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export default function CapitalPanel() {
  const id = idDeUrl()
  const { tienePermiso, cargando: cargandoPermisos } = usePermisos()
  const [capital, setCapital] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [tenantNombre, setTenantNombre] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [errorAccion, setErrorAccion] = useState('')
  const [confirmandoSuspension, setConfirmandoSuspension] = useState(false)
  const [pidiendoPassword, setPidiendoPassword] = useState(false)
  const [confirmandoReactivacion, setConfirmandoReactivacion] = useState(false)
  const [mostrandoAjuste, setMostrandoAjuste] = useState(false)

  async function cargar() {
    setCargando(true)
    const { ok, datos } = await apiFetch(`/api/tenant/capital/${id}`)
    if (!ok) { setError(datos.error || 'No se pudo cargar el capital.'); setCargando(false); return }
    setCapital(datos.capital)
    setMovimientos(datos.movimientos || [])
    setTenantNombre(datos.tenantNombre || '')
    setCargando(false)
  }

  // Reimprime el voucher de un movimiento ya cargado en memoria — sin llamada a la
  // API de por medio, así que no hay riesgo de perder el gesto del usuario y se
  // puede usar el atajo que abre y escribe la pestaña en el mismo paso.
  function imprimirVoucher(m) {
    abrirTirillaAjusteCapital({
      tenantNombre,
      fecha: m.fecha,
      tipo: m.entrada ? 'AGREGAR' : 'QUITAR',
      nombreCapital: capital.nombre,
      codigoCapital: capital.codigo,
      valorAnterior: m.valorAnterior,
      valorNuevo: m.valorNuevo,
      monto: m.monto,
      nombreAutor: m.registradoPor,
      nombreContraparte: m.nombreContraparte,
      qrSvg: m.qrSvg,
    })
  }

  useEffect(() => { cargar() }, [id])

  // Tras suspender/reactivar se vuelve a pedir el detalle completo (no solo el
  // estado) para que el nuevo movimiento de evento aparezca de una vez en el
  // historial, sin tener que recargar la página.
  async function suspenderCapital(password) {
    const { ok, datos } = await apiFetch(`/api/tenant/capital/${id}/suspender`, {
      method: 'PATCH',
      body: { password },
    })
    if (!ok) throw new Error(datos.error || 'No se pudo suspender el capital.')
    setPidiendoPassword(false)
    await cargar()
  }

  async function reactivarCapital() {
    setConfirmandoReactivacion(false)
    setErrorAccion('')
    const { ok, datos } = await apiFetch(`/api/tenant/capital/${id}/reactivar`, { method: 'PATCH' })
    if (ok) await cargar()
    else setErrorAccion(datos.error || 'No se pudo reactivar el capital.')
  }

  // Tras un ajuste exitoso: refresca el panel (nuevo valorTotal/disponible +
  // movimiento en el historial) y rellena la tirilla imprimible (ya abierta en
  // blanco por el llamador, antes del await, para no perder el gesto del usuario)
  // con el comprobante que devuelve el backend — el email ya se envió del servidor.
  async function ajustarCapital(datosAjuste, ventana) {
    const { ok, datos } = await apiFetch(`/api/tenant/capital/${id}/ajustar-capital`, {
      method: 'PATCH',
      body: datosAjuste,
    })
    if (!ok) throw new Error(datos.error || 'No se pudo ajustar el capital.')
    await cargar()
    escribirTirillaAjusteCapital(ventana, datos.comprobante)
  }

  if (cargando) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">
        <p className="text-[13px] text-on-surface-variant">Cargando...</p>
      </div>
    )
  }

  if (error || !capital) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">
        <a href="/capital" className="text-[13px] text-on-surface-variant no-underline hover:text-on-background">← Volver a Capital y Socios</a>
        <div className="mt-4 rounded-2xl border border-outline-variant/50 bg-surface-lowest p-8 text-center shadow-card">
          <p className="text-on-surface-variant text-sm">{error || 'Capital no encontrado.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">
      <a href="/capital" className="inline-block text-[13px] text-on-surface-variant no-underline hover:text-on-background mb-4">
        ← Volver a Capital y Socios
      </a>

      {/* Encabezado */}
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1 text-secondary">{capital.codigo}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-background tracking-tight">{capital.nombre}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${claseAvatar(0)}`}>
              {inicialesDe(capital.socio.nombre)}
            </span>
            <span className="text-[13px] text-on-surface-variant">{capital.socio.nombre}</span>
            <ChipEstado estado={capital.estado} />
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {/* No se muestra mientras cargan los permisos, sin permiso de editar, ni si
              el capital está suspendido (el backend rechaza ajustes en ese estado —
              primero hay que reactivarlo desde la zona de riesgo, más abajo). */}
          {!cargandoPermisos && tienePermiso('capital.editar') && capital.estado === 'ACTIVA' && (
            <button
              onClick={() => setMostrandoAjuste(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary-container text-primary-fixed text-[13px] font-semibold hover:brightness-95 transition-all"
            >
              <IcoMoneda /> Agregar/Disminuir capital
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <TarjetaStat
          compacto
          titulo="Valor del capital"
          subtitulo="Monto total invertido"
          valor={formatearPrecio(capital.valorTotal)}
          imagen3d="/iconos/capitales.webp"
        />
        <TarjetaStat
          compacto
          titulo="Disponible"
          subtitulo="Listo para prestar"
          valor={formatearPrecio(capital.disponible)}
          imagen3d="/iconos/banco.webp"
        />
        <TarjetaStat
          compacto
          titulo="En uso"
          subtitulo="Comprometido en préstamos"
          valor={formatearPrecio(capital.enUso)}
          imagen3d="/iconos/prestamos.webp"
        />
        <TarjetaStat
          compacto
          centrarValor
          titulo="Nro. de préstamos"
          subtitulo="Ligados a este capital"
          valor={String(capital.numPrestamos)}
          imagen3d="/iconos/recaudo.webp"
        />
      </div>

      {/* Historial de movimientos */}
      <TarjetaPanel
        icono={<IcoHistorial />}
        iconoClases="bg-primary/10 text-primary"
        titulo="Historial de movimientos"
        subtitulo="Últimos aportes, retiros y préstamos de este capital"
      >
        {movimientos.length === 0 ? (
          <p className="text-[13px] text-on-surface-variant">Aún no hay movimientos registrados.</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full min-w-[640px] text-[13px] border-collapse">
              <thead>
                <tr className="text-left text-[11px] text-on-surface-variant uppercase tracking-wide">
                  <th className="font-semibold px-1 pb-2">Movimiento</th>
                  <th className="font-semibold px-1 pb-2">Monto</th>
                  <th className="font-semibold px-1 pb-2">Saldo después</th>
                  <th className="font-semibold px-1 pb-2">Registrado por</th>
                  <th className="font-semibold px-1 pb-2">Fecha</th>
                  <th className="font-semibold px-1 pb-2 text-center">Voucher</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map(m => (
                  <tr key={m.id} className="border-t border-outline-variant/40 hover:bg-surface-default/60 transition-colors">
                    <td className="px-1 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          m.esEvento
                            ? 'bg-outline-variant/30 text-on-surface-variant'
                            : m.entrada ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'
                        }`}>
                          {m.esEvento ? <IcoEvento /> : m.entrada ? <IcoFlechaAbajo /> : <IcoFlechaArriba />}
                        </span>
                        <span className="text-on-background font-medium whitespace-nowrap">{m.etiquetaTipo}</span>
                      </div>
                    </td>
                    <td className={`px-1 py-2.5 font-semibold whitespace-nowrap ${
                      m.esEvento ? 'text-on-surface-variant' : m.entrada ? 'text-secondary' : 'text-error'
                    }`}>
                      {m.esEvento ? '—' : `${m.entrada ? '+' : '−'} ${formatearPrecio(m.monto)}`}
                    </td>
                    <td className="px-1 py-2.5 text-on-background whitespace-nowrap">{formatearPrecio(m.saldoDespues)}</td>
                    <td className="px-1 py-2.5 text-on-surface-variant whitespace-nowrap">{m.registradoPor}</td>
                    <td className="px-1 py-2.5 text-on-surface-variant whitespace-nowrap">{formatearFecha(m.fecha)}</td>
                    <td className="px-1 py-2.5 text-center">
                      {m.puedeImprimirVoucher && (
                        <button
                          onClick={() => imprimirVoucher(m)}
                          title="Imprimir voucher de este movimiento"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <IcoImprimir size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TarjetaPanel>

      {/* Préstamos ligados a este capital — módulo de Créditos aún no construido */}
      <div className="mt-4 rounded-2xl border border-outline-variant/50 bg-surface-lowest p-8 text-center shadow-card">
        <span className="inline-flex w-10 h-10 rounded-xl bg-primary/10 text-primary items-center justify-center mb-3">
          <IcoEdificio size={18} />
        </span>
        <p className="text-on-surface-variant text-sm m-0">
          El listado de préstamos otorgados con este capital estará disponible cuando se construya el módulo de Créditos.
        </p>
      </div>

      {/* Zona de riesgo — footer del panel. Suspender/Activar cambian el estado del
          capital completo, así que viven separados de las acciones normales de
          arriba (agregar/quitar), no junto a ellas. */}
      {!cargandoPermisos && (tienePermiso('capital.eliminar') || tienePermiso('capital.crear')) && (
        <div className="mt-6 pt-6 border-t border-outline-variant/50">
          <div className="rounded-2xl border border-error/20 bg-error-container/20 p-5 sm:p-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center shrink-0">
                <IcoAlerta />
              </span>
              <div>
                <p className="text-[14px] font-semibold text-on-background m-0">Zona de riesgo</p>
                <p className="text-[12px] text-on-surface-variant m-0 mt-0.5">
                  {capital.estado === 'ACTIVA'
                    ? 'Suspender este capital impide que se le asignen nuevos préstamos.'
                    : 'Este capital está suspendido y no puede recibir nuevos préstamos.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              {tienePermiso('capital.eliminar') && capital.estado === 'ACTIVA' && (
                <button
                  onDoubleClick={() => setConfirmandoSuspension(true)}
                  title="Haz doble clic para suspender este capital"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-error/10 text-error text-[13px] font-semibold hover:bg-error/15 transition-colors select-none"
                >
                  <IcoPausa /> Suspender capital
                </button>
              )}
              {tienePermiso('capital.crear') && capital.estado === 'INACTIVA' && (
                <button
                  onClick={() => setConfirmandoReactivacion(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary/10 text-secondary text-[13px] font-semibold hover:bg-secondary/15 transition-colors"
                >
                  <IcoPlay /> Activar capital
                </button>
              )}
              {errorAccion && <p className="text-[12px] text-error m-0">{errorAccion}</p>}
            </div>
          </div>
        </div>
      )}

      {mostrandoAjuste && (
        <ModalAjustarCapital
          capital={capital}
          onCerrar={() => setMostrandoAjuste(false)}
          onAjustar={ajustarCapital}
        />
      )}

      {confirmandoSuspension && (
        <ModalConfirmacion
          tipo="advertencia"
          titulo="¿Suspender este capital?"
          mensaje={
            <>
              <strong>{capital.nombre}</strong> quedará suspendido: a partir de ahora no se le asignarán nuevos
              préstamos. Los créditos que ya se otorgaron con este capital seguirán activos y su cobro continuará
              con total normalidad — esta acción no los afecta.
            </>
          }
          textoConfirmar="Sí, continuar"
          onConfirmar={() => { setConfirmandoSuspension(false); setPidiendoPassword(true) }}
          onCancelar={() => setConfirmandoSuspension(false)}
        />
      )}

      {pidiendoPassword && (
        <ModalConfirmarContrasena
          titulo="Confirma tu identidad"
          mensaje="Por seguridad, ingresa tu contraseña para suspender este capital."
          textoConfirmar="Suspender capital"
          onConfirmar={suspenderCapital}
          onCancelar={() => setPidiendoPassword(false)}
        />
      )}

      {confirmandoReactivacion && (
        <ModalConfirmacion
          tipo="confirmacion"
          titulo="¿Activar este capital?"
          mensaje={
            <>
              <strong>{capital.nombre}</strong> volverá a estar disponible para asignarse a nuevos préstamos.
            </>
          }
          textoConfirmar="Sí, activar"
          onConfirmar={reactivarCapital}
          onCancelar={() => setConfirmandoReactivacion(false)}
        />
      )}
    </div>
  )
}
