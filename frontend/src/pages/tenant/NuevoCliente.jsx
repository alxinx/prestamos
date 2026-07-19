import { useEffect, useState } from 'react'
import AnilloProgreso from '../../components/tenant/AnilloProgreso'
import { IcoPersonas, IcoCheck } from '../../components/tenant/iconos'
import usePermisos from '../../hooks/usePermisos'
import { apiFetch } from '../../lib/api'
import { navegarA } from '../../lib/navegacion'
import Paso1DatosPersonales from '../../components/tenant/clienteWizard/Paso1DatosPersonales'
import Paso2InformacionOperativa from '../../components/tenant/clienteWizard/Paso2InformacionOperativa'
import Paso3Ubicaciones from '../../components/tenant/clienteWizard/Paso3Ubicaciones'
import Paso4Referencias from '../../components/tenant/clienteWizard/Paso4Referencias'
import { UBICACION_VACIA, REFERENCIA_VACIA } from '../../lib/clienteWizardConstantes'
import Paso5Consentimientos from '../../components/tenant/clienteWizard/Paso5Consentimientos'
import ModalConfirmarGuardarCliente from '../../components/tenant/clienteWizard/ModalConfirmarGuardarCliente'

const PASOS = [
  { numero: 1, etiqueta: 'Datos personales' },
  { numero: 2, etiqueta: 'Información operativa' },
  { numero: 3, etiqueta: 'Ubicaciones' },
  { numero: 4, etiqueta: 'Referencias personales' },
  { numero: 5, etiqueta: 'Consentimientos' },
]

const DATOS_PERSONALES_INICIAL = { nombreCompleto: '', telefono: '', email: '', fechaNacimiento: '' }
const INFO_OPERATIVA_INICIAL = { zonaId: '', cobradorId: '', observaciones: '' }
const CONSENTIMIENTOS_INICIAL = { tratamientoDatos: true, compartirScore: false, notificacionesWsp: false }

function ResumenFila({ etiqueta, valor }) {
  if (!valor) return null
  return (
    <div>
      <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wide m-0">{etiqueta}</p>
      <p className="text-[13px] font-semibold text-on-background m-0">{valor}</p>
    </div>
  )
}

// Wizard de 5 pasos para registrar un cliente. El estado de todo el formulario
// vive acá (los Paso*.jsx son controlados, sin estado propio) — necesario porque
// hay que poder ir/volver entre pasos sin perder lo ya escrito, y el POST final
// manda todo junto en un solo multipart/form-data (necesario por los documentos
// adjuntos; por eso ubicaciones/referencias viajan como JSON stringificado,
// mismo patrón que documentosMeta en colaboradores).
export default function NuevoCliente() {
  const { tienePermiso, cargando: cargandoPermisos } = usePermisos()

  const [paso, setPaso] = useState(1)

  const [cedula, setCedula] = useState('')
  const [resultadoCedula, setResultadoCedula] = useState(null)
  const [buscandoCedula, setBuscandoCedula] = useState(false)
  const [errorCedula, setErrorCedula] = useState('')
  const [datosPersonales, setDatosPersonales] = useState(DATOS_PERSONALES_INICIAL)

  const [infoOperativa, setInfoOperativa] = useState(INFO_OPERATIVA_INICIAL)
  const [zonas, setZonas] = useState([])
  const [cobradores, setCobradores] = useState([])

  const [ubicaciones, setUbicaciones] = useState([{ ...UBICACION_VACIA }])
  const [indiceUbicacionActiva, setIndiceUbicacionActiva] = useState(0)

  const [referencias, setReferencias] = useState([])
  const [indiceReferenciaActiva, setIndiceReferenciaActiva] = useState(null)

  const [consentimientos, setConsentimientos] = useState(CONSENTIMIENTOS_INICIAL)
  const [documentos, setDocumentos] = useState([])

  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState('')
  const [mostrandoConfirmacion, setMostrandoConfirmacion] = useState(false)

  useEffect(() => {
    apiFetch('/api/tenant/zonas-cobertura').then(({ ok, datos }) => { if (ok) setZonas(datos.zonas || []) })
    apiFetch('/api/tenant/colaboradores').then(({ ok, datos }) => {
      if (ok) setCobradores((datos.colaboradores || []).filter(c => c.rol?.nombre === 'COBRADOR' && c.estado === 'ACTIVO'))
    })
  }, [])

  // Búsqueda automática de la cédula (debounced) — no depende de ningún clic.
  // Se dispara sola 450ms después de que el usuario deja de escribir, y solo si
  // ya hay al menos 5 dígitos (evita buscar en cada tecla desde el principio).
  useEffect(() => {
    const cedulaTrim = cedula.trim()
    setResultadoCedula(null)
    setErrorCedula('')

    if (cedulaTrim.length < 5) {
      setBuscandoCedula(false)
      return
    }

    setBuscandoCedula(true)
    let vigente = true

    const idTimeout = setTimeout(async () => {
      const { ok, datos } = await apiFetch(`/api/tenant/clientes/verificar-cedula/${encodeURIComponent(cedulaTrim)}`)
      if (!vigente) return // la cédula ya cambió mientras esperábamos esta respuesta
      setBuscandoCedula(false)
      if (!ok) { setErrorCedula(datos.error || 'No se pudo verificar la cédula.'); return }
      setResultadoCedula(datos)
      setDatosPersonales(
        datos.existeGlobal && datos.clienteGlobal
          ? {
              nombreCompleto: datos.clienteGlobal.nombreCompleto,
              telefono: datos.clienteGlobal.telefono,
              email: datos.clienteGlobal.email || '',
              fechaNacimiento: datos.clienteGlobal.fechaNacimiento ? datos.clienteGlobal.fechaNacimiento.slice(0, 10) : '',
            }
          : DATOS_PERSONALES_INICIAL
      )
    }, 450)

    return () => { vigente = false; clearTimeout(idTimeout) }
  }, [cedula])

  function actualizarDatosPersonales(campo, valor) {
    setDatosPersonales(d => ({ ...d, [campo]: valor }))
  }
  function actualizarInfoOperativa(campo, valor) {
    setInfoOperativa(o => ({ ...o, [campo]: valor }))
  }

  function agregarUbicacion() {
    setUbicaciones(u => [...u, { ...UBICACION_VACIA }])
    setIndiceUbicacionActiva(ubicaciones.length)
  }
  function eliminarUbicacion(i) {
    setUbicaciones(u => u.filter((_, idx) => idx !== i))
    setIndiceUbicacionActiva(idx => (idx >= i ? Math.max(0, idx - 1) : idx))
  }
  function actualizarUbicacionActiva(campo, valor) {
    setUbicaciones(u => u.map((item, idx) => (idx === indiceUbicacionActiva ? { ...item, [campo]: valor } : item)))
  }

  function agregarReferencia() {
    setReferencias(r => [...r, { ...REFERENCIA_VACIA }])
    setIndiceReferenciaActiva(referencias.length)
  }
  function eliminarReferencia(i) {
    setReferencias(r => r.filter((_, idx) => idx !== i))
    setIndiceReferenciaActiva(idx => {
      if (idx === null || idx === i) return null
      return idx > i ? idx - 1 : idx
    })
  }
  function actualizarReferenciaActiva(campo, valor) {
    setReferencias(r => r.map((item, idx) => (idx === indiceReferenciaActiva ? { ...item, [campo]: valor } : item)))
  }

  function actualizarConsentimiento(campo, valor) {
    setConsentimientos(c => ({ ...c, [campo]: valor }))
  }

  const paso1Valido = !!resultadoCedula && !resultadoCedula.existeEnTenant && !!datosPersonales.nombreCompleto.trim() && !!datosPersonales.telefono.trim()
  const paso3Valido = ubicaciones.length > 0 && ubicaciones.every(u => u.tipo && u.direccion.trim() && u.ciudad.trim())
  const paso5Valido = consentimientos.tratamientoDatos

  function validoParaAvanzar(desde) {
    if (desde === 1) return paso1Valido
    if (desde === 3) return paso3Valido
    return true
  }

  function siguiente() {
    if (!validoParaAvanzar(paso)) return
    setPaso(p => Math.min(5, p + 1))
    window.scrollTo(0, 0)
  }
  function anterior() {
    setPaso(p => Math.max(1, p - 1))
    window.scrollTo(0, 0)
  }

  function abrirConfirmacion() {
    if (!paso5Valido) return
    setErrorGuardar('')
    setMostrandoConfirmacion(true)
  }

  async function guardar(irACrearPrestamo) {
    setMostrandoConfirmacion(false)
    setGuardando(true)
    setErrorGuardar('')
    try {
      const cuerpo = new FormData()
      cuerpo.append('cedula', cedula.trim())
      cuerpo.append('nombreCompleto', datosPersonales.nombreCompleto)
      cuerpo.append('telefono', datosPersonales.telefono)
      cuerpo.append('email', datosPersonales.email || '')
      cuerpo.append('fechaNacimiento', datosPersonales.fechaNacimiento || '')
      cuerpo.append('zonaId', infoOperativa.zonaId || '')
      cuerpo.append('cobradorId', infoOperativa.cobradorId || '')
      cuerpo.append('observaciones', infoOperativa.observaciones || '')
      cuerpo.append('ubicaciones', JSON.stringify(ubicaciones))
      cuerpo.append('referencias', JSON.stringify(referencias))
      cuerpo.append('consentimientoTratamientoDatos', String(consentimientos.tratamientoDatos))
      cuerpo.append('consentimientoCompartirScore', String(consentimientos.compartirScore))
      cuerpo.append('consentimientoNotificacionesWsp', String(consentimientos.notificacionesWsp))
      cuerpo.append('documentosMeta', JSON.stringify(documentos.map(f => ({ nombre: f.name }))))
      documentos.forEach(f => cuerpo.append('documentosArchivos', f))

      const { ok, datos } = await apiFetch('/api/tenant/clientes', { method: 'POST', body: cuerpo })
      if (!ok) {
        setErrorGuardar(datos.error || 'No se pudo guardar el cliente.')
        setGuardando(false)
        return
      }

      if (irACrearPrestamo) {
        const params = new URLSearchParams({
          clienteId: datos.cliente.id,
          clienteNombre: datos.cliente.nombreCompleto,
          clienteCedula: datos.cliente.cedula,
          clienteTelefono: datos.cliente.telefono,
        })
        navegarA(`/prestamos/nuevo?${params}`)
        return
      }
      navegarA('/clientes')
    } catch {
      setErrorGuardar('Error de conexión. Intenta nuevamente.')
      setGuardando(false)
    }
  }

  if (!cargandoPermisos && !tienePermiso('clientes.crear')) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">
        <div className="rounded-2xl border border-outline-variant/50 bg-surface-lowest p-8 text-center shadow-card">
          <p className="text-on-surface-variant text-sm">No tienes permiso para registrar clientes.</p>
        </div>
      </div>
    )
  }

  const porcentaje = paso * 20

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">
      <div>
        <a href="/clientes" className="text-[12px] text-on-surface-variant no-underline hover:text-on-background">Clientes</a>
        <span className="text-[12px] text-on-surface-variant mx-1.5">/</span>
        <span className="text-[12px] text-on-background font-medium">Nuevo cliente</span>
      </div>

      <div className="mt-4 mb-6 flex items-center gap-3">
        <span className="w-11 h-11 rounded-xl bg-secondary-container/25 text-secondary flex items-center justify-center shrink-0">
          <IcoPersonas size={20} />
        </span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-background tracking-tight m-0">Nuevo cliente</h1>
          <p className="text-[13px] text-on-surface-variant mt-0.5 m-0">Completa la información para registrar un nuevo cliente en el sistema.</p>
        </div>
      </div>

      {/* Indicador de pasos — los ya completados se pueden clickear para saltar
          directo, sin tener que darle "Anterior" varias veces. Los pendientes
          (adelante del actual) no son clickeables: todavía no hay nada que
          revisar ahí y saltarlos se saltaría su validación. */}
      <div className="flex items-start mb-6 max-w-[720px]">
        {PASOS.map((p, i) => {
          const completado = p.numero < paso
          return (
            <div key={p.numero} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => completado && setPaso(p.numero)}
                disabled={!completado}
                className={`flex flex-col items-center gap-1.5 shrink-0 w-20 bg-transparent border-none p-0 ${completado ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 transition-transform ${
                  completado ? 'bg-secondary text-on-primary hover:scale-110' : p.numero === paso ? 'bg-primary text-on-primary' : 'bg-surface-default text-on-surface-variant border border-outline-variant'
                }`}>
                  {completado ? <IcoCheck size={14} /> : p.numero}
                </span>
                <span className={`text-[11px] font-semibold text-center leading-tight ${p.numero === paso ? 'text-on-background' : 'text-on-surface-variant'}`}>
                  {p.etiqueta}
                </span>
              </button>
              {i < PASOS.length - 1 && (
                <div className={`flex-1 h-[2px] mx-1 -mt-5 ${p.numero < paso ? 'bg-secondary' : 'bg-outline-variant'}`} />
              )}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-5 items-start">
        <div>
          {paso === 1 && (
            <Paso1DatosPersonales
              cedula={cedula}
              onCambiarCedula={setCedula}
              buscando={buscandoCedula}
              error={errorCedula}
              resultado={resultadoCedula}
              datosPersonales={datosPersonales}
              onCambiarDatosPersonales={actualizarDatosPersonales}
            />
          )}
          {paso === 2 && (
            <Paso2InformacionOperativa zonas={zonas} cobradores={cobradores} valores={infoOperativa} onCambiar={actualizarInfoOperativa} />
          )}
          {paso === 3 && (
            <Paso3Ubicaciones
              ubicaciones={ubicaciones}
              indiceActivo={indiceUbicacionActiva}
              onSeleccionar={setIndiceUbicacionActiva}
              onAgregar={agregarUbicacion}
              onEliminar={eliminarUbicacion}
              onActualizarActiva={actualizarUbicacionActiva}
            />
          )}
          {paso === 4 && (
            <Paso4Referencias
              referencias={referencias}
              indiceActivo={indiceReferenciaActiva}
              onSeleccionar={setIndiceReferenciaActiva}
              onAgregar={agregarReferencia}
              onEliminar={eliminarReferencia}
              onActualizarActiva={actualizarReferenciaActiva}
            />
          )}
          {paso === 5 && (
            <Paso5Consentimientos
              consentimientos={consentimientos}
              onCambiarConsentimiento={actualizarConsentimiento}
              documentos={documentos}
              onCambiarDocumentos={setDocumentos}
            />
          )}

          {errorGuardar && <p className="text-[13px] text-error mt-3">{errorGuardar}</p>}

          <div className="flex items-center justify-between mt-5">
            <a
              href="/clientes"
              className="px-4 py-2.5 rounded-lg bg-surface-default border border-outline-variant text-on-surface-variant text-[13px] font-medium no-underline hover:bg-surface-high transition-colors"
            >
              Cancelar
            </a>
            <div className="flex items-center gap-2.5">
              {paso > 1 && (
                <button
                  type="button"
                  onClick={anterior}
                  className="px-4 py-2.5 rounded-lg bg-surface-default border border-outline-variant text-on-surface-variant text-[13px] font-medium cursor-pointer hover:bg-surface-high transition-colors"
                >
                  ← Anterior
                </button>
              )}
              {paso < 5 ? (
                <button
                  type="button"
                  onClick={siguiente}
                  disabled={!validoParaAvanzar(paso)}
                  className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-[13px] font-bold cursor-pointer hover:brightness-125 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={abrirConfirmacion}
                  disabled={!paso5Valido || guardando}
                  className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-[13px] font-bold cursor-pointer hover:brightness-125 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1.5"
                >
                  Guardar cliente <IcoCheck size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar derecho */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-surface-lowest border border-outline-variant/50 shadow-card p-5">
            <p className="text-[13.5px] font-bold text-on-background mb-4">Progreso del registro</p>
            <div className="flex justify-center mb-4">
              <AnilloProgreso
                valor={`${porcentaje}%`}
                etiqueta="Completado"
                porcentaje={porcentaje}
                color="var(--color-secondary)"
                colorFondo="var(--color-secondary-container)"
                tamano={130}
                grosor={10}
              />
            </div>
            <div className="flex flex-col">
              {PASOS.map(p => {
                const completado = p.numero < paso
                return (
                  <button
                    type="button"
                    key={p.numero}
                    onClick={() => completado && setPaso(p.numero)}
                    disabled={!completado}
                    className={`flex items-start gap-2.5 py-2 bg-transparent border-none text-left w-full ${completado ? 'cursor-pointer hover:opacity-75' : 'cursor-default'}`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      completado ? 'bg-secondary text-on-primary' : p.numero === paso ? 'bg-primary text-on-primary' : 'bg-outline-variant/40 text-on-surface-variant'
                    }`}>
                      {completado ? <IcoCheck size={11} /> : p.numero}
                    </span>
                    <div>
                      <p className="text-[12.5px] font-semibold text-on-background m-0">{p.etiqueta}</p>
                      <p className="text-[11px] text-on-surface-variant m-0">
                        {completado ? 'Completado' : p.numero === paso ? 'En progreso' : 'Pendiente'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {paso === 1 ? (
            <div className="rounded-2xl bg-surface-lowest border border-outline-variant/50 shadow-card p-5 text-center">
              <img
                src="/iconos/servico%20al%20cliente.webp"
                alt=""
                className="w-24 h-24 mx-auto mb-2 select-none pointer-events-none"
              />
              <p className="text-[13.5px] font-bold text-on-background mb-2">¿Necesitas ayuda?</p>
              <p className="text-[12px] text-on-surface-variant leading-relaxed mb-3">
                Si tienes dudas sobre algún campo, consulta nuestra guía o contáctanos.
              </p>
              <a
                href="/soporte"
                className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-primary no-underline hover:underline"
              >
                Ver guía rápida ↗
              </a>
            </div>
          ) : (
            <div className="rounded-2xl bg-surface-lowest border border-outline-variant/50 shadow-card p-5">
              <p className="text-[13.5px] font-bold text-on-background mb-3">Resumen del cliente</p>
              <div className="flex flex-col gap-3">
                <ResumenFila etiqueta={resultadoCedula?.existeGlobal ? 'Cliente Global' : 'Cliente nuevo'} valor={datosPersonales.nombreCompleto} />
                <ResumenFila etiqueta="Cédula" valor={cedula} />
                <ResumenFila etiqueta="Teléfono" valor={datosPersonales.telefono} />
                {datosPersonales.email && <ResumenFila etiqueta="Email" valor={datosPersonales.email} />}
                {infoOperativa.cobradorId && (
                  <ResumenFila etiqueta="Cobrador asignado" valor={cobradores.find(c => c.id === infoOperativa.cobradorId)?.nombreCompleto} />
                )}
                {infoOperativa.zonaId && (
                  <ResumenFila etiqueta="Zona de cobertura" valor={zonas.find(z => z.id === infoOperativa.zonaId)?.nombre} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {mostrandoConfirmacion && (
        <ModalConfirmarGuardarCliente
          datos={{
            cedula,
            nombreCompleto: datosPersonales.nombreCompleto,
            telefono: datosPersonales.telefono,
            email: datosPersonales.email,
            fechaNacimiento: datosPersonales.fechaNacimiento,
            zona: zonas.find(z => z.id === infoOperativa.zonaId)?.nombre,
            cobrador: cobradores.find(c => c.id === infoOperativa.cobradorId)?.nombreCompleto,
            observaciones: infoOperativa.observaciones,
            ubicaciones,
            referencias,
            consentimientos,
          }}
          guardando={guardando}
          onCorregir={() => setMostrandoConfirmacion(false)}
          onGuardar={() => guardar(false)}
          onGuardarYCrearPrestamo={() => guardar(true)}
        />
      )}
    </div>
  )
}
