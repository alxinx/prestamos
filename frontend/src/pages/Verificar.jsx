import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'
import { formatearPrecio, formatearFechaHora } from '../lib/formato'

// Página pública de verificación de documentos (QR impreso en vouchers) — sin
// AuthProvider, sin links hacia el resto de la app, sin nombre del negocio/tenant.
// Ver App.jsx: se registra antes del bloque de rutas autenticadas, igual que /activar.
function tokenDeUrl() {
  const partes = window.location.pathname.split('/')
  return partes[2] ?? '' // /verificar/:token
}

const ETIQUETAS_TIPO_DOCUMENTO = {
  CIERRE_CAJA_INDIVIDUAL: 'Cierre de caja individual',
  AJUSTE_CAPITAL: 'Ajuste de capital',
  RESUMEN_PRESTAMO: 'Resumen de préstamo',
}

const ETIQUETAS_FRECUENCIA_VERIFICAR = { DIARIO: 'Diario', SEMANAL: 'Semanal', QUINCENAL: 'Quincenal', MENSUAL: 'Mensual' }

function IcoCheck() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function IcoAlerta() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function Fila({ etiqueta, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-outline-variant/40 last:border-b-0">
      <span className="text-[12.5px] text-on-surface-variant shrink-0">{etiqueta}</span>
      <span className="text-[13.5px] font-semibold text-on-background text-right">{children}</span>
    </div>
  )
}

function DetalleCierreCaja({ datos }) {
  const sinDiferencia = Number(datos.diferencia) === 0
  return (
    <>
      <Fila etiqueta="Fecha">{datos.fecha}</Fila>
      <Fila etiqueta="Cobrador">{datos.cobrador}</Fila>
      <Fila etiqueta="Total según sistema">{formatearPrecio(datos.totalSegunSistema)}</Fila>
      <Fila etiqueta="Total entregado">{formatearPrecio(datos.totalEntregado)}</Fila>
      <Fila etiqueta="Diferencia">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
          sinDiferencia ? 'bg-secondary-container/25 text-on-secondary-container' : 'bg-error-container text-on-error-container'
        }`}>
          {formatearPrecio(datos.diferencia)}
        </span>
      </Fila>
      {datos.aprobadoPor && <Fila etiqueta="Aprobado por">{datos.aprobadoPor}</Fila>}
      {datos.horaAprobacion && <Fila etiqueta="Hora de aprobación">{datos.horaAprobacion}</Fila>}
    </>
  )
}

function DetalleAjusteCapital({ datos }) {
  const esAgregar = datos.tipo === 'AGREGAR'
  return (
    <>
      <Fila etiqueta="Fecha">{formatearFechaHora(datos.fecha)}</Fila>
      <Fila etiqueta="Tipo">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
          esAgregar ? 'bg-secondary-container/25 text-on-secondary-container' : 'bg-error-container text-on-error-container'
        }`}>
          {esAgregar ? 'Capital agregado' : 'Capital retirado'}
        </span>
      </Fila>
      <Fila etiqueta="Capital">{datos.capital}</Fila>
      <Fila etiqueta="Valor anterior">{formatearPrecio(datos.valorAnterior)}</Fila>
      <Fila etiqueta="Valor nuevo">{formatearPrecio(datos.valorNuevo)}</Fila>
      <Fila etiqueta={esAgregar ? 'Monto agregado' : 'Monto retirado'}>{formatearPrecio(datos.monto)}</Fila>
      <Fila etiqueta="Autorizado por">{datos.autorizadoPor}</Fila>
      {datos.contraparte && <Fila etiqueta={esAgregar ? 'Recibido de' : 'Entregado a'}>{datos.contraparte}</Fila>}
    </>
  )
}

function DetalleResumenPrestamo({ datos }) {
  return (
    <>
      <Fila etiqueta="Fecha">{formatearFechaHora(datos.fecha)}</Fila>
      <Fila etiqueta="Cliente">{datos.cliente}</Fila>
      <Fila etiqueta="Cédula">{datos.clienteCedula}</Fila>
      <Fila etiqueta="Cobrador">{datos.cobrador}</Fila>
      <Fila etiqueta="Valor prestado">{formatearPrecio(datos.montoInicial)}</Fila>
      <Fila etiqueta="Tasa de interés">{`${datos.tasaInteres}% ${ETIQUETAS_FRECUENCIA_VERIFICAR[datos.frecuenciaPago] ?? datos.frecuenciaPago}`}</Fila>
      <Fila etiqueta="Número de cuotas">{Number(datos.numeroCuotas) === 0 ? 'Solo intereses' : datos.numeroCuotas}</Fila>
    </>
  )
}

const DETALLES_POR_TIPO = {
  CIERRE_CAJA_INDIVIDUAL: DetalleCierreCaja,
  AJUSTE_CAPITAL: DetalleAjusteCapital,
  RESUMEN_PRESTAMO: DetalleResumenPrestamo,
}

export default function Verificar() {
  const token = tokenDeUrl()
  const [cargando, setCargando] = useState(true)
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    let activo = true
    apiFetch(`/api/verificar/${token}`).then(({ ok, datos }) => {
      if (!activo) return
      setResultado(ok ? datos : null)
      setCargando(false)
    })
    return () => { activo = false }
  }, [token])

  const DetalleDocumento = resultado ? DETALLES_POR_TIPO[resultado.tipoDocumento] : null

  return (
    <div className="min-h-svh bg-background flex flex-col" style={{ fontFamily: 'var(--font-sans)' }}>
      <header className="px-6 py-5 flex items-center justify-center">
        <img src="/logotipo_sin slogan.webp" alt="GotaPay" className="h-10 w-auto" />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px]">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 shadow-card overflow-hidden">

            {cargando ? (
              <div className="p-10 text-center">
                <span className="inline-block w-6 h-6 rounded-full border-2 border-outline-variant border-t-primary animate-spin" />
                <p className="text-[13px] text-on-surface-variant mt-4 m-0">Verificando documento...</p>
              </div>
            ) : resultado?.valido ? (
              <>
                <div className="flex flex-col items-center px-7 pt-8 pb-6 text-center bg-secondary-container/15">
                  <div className="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center mb-4 text-on-secondary-container">
                    <IcoCheck />
                  </div>
                  <h1 className="text-[19px] font-bold text-on-background m-0">Documento válido</h1>
                  <p className="text-[12.5px] text-on-surface-variant mt-1.5 mb-0">
                    {ETIQUETAS_TIPO_DOCUMENTO[resultado.tipoDocumento] ?? resultado.tipoDocumento}
                  </p>
                </div>

                <div className="px-7 py-5">
                  {DetalleDocumento
                    ? <DetalleDocumento datos={resultado.datos} />
                    : <p className="text-[13px] text-on-surface-variant m-0">Tipo de documento no reconocido.</p>}
                </div>

                <div className="px-7 pb-6">
                  <p className="text-[11px] text-on-surface-variant/80 m-0 leading-relaxed">
                    Este documento fue generado por el sistema y corresponde a un registro real. Compare estos datos
                    con los del comprobante impreso donde escaneneó el QR: deben coincidir exactamente. Si encuentra
                    alguna diferencia, 🚨sospeche del documento🚨.
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center px-7 py-10 text-center">
                <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center mb-4 text-on-error-container">
                  <IcoAlerta />
                </div>
                <h1 className="text-[19px] font-bold text-on-background m-0 mb-2">Documento no encontrado</h1>
                <p className="text-[13px] text-on-surface-variant leading-relaxed m-0">
                  No pudimos verificar este documento. El enlace puede ser incorrecto o el documento ya no está disponible.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="px-6 py-4 text-center text-[11px] text-on-surface-variant/70">
        © {new Date().getFullYear()} GotaPay
      </footer>
    </div>
  )
}
