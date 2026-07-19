import { useEffect, useState } from 'react'
import usePermisos from '../../hooks/usePermisos'
import useLimitePlan from '../../hooks/useLimitePlan'
import { apiFetch } from '../../lib/api'
import { navegarA } from '../../lib/navegacion'
import { IcoMoneda, IcoCheck } from '../../components/tenant/iconos'
import { fechaHoyISO } from '../../lib/formato'
import { DETALLES_VACIO, GARANTIA_VACIA, DEUDOR_SOLIDARIO_VACIO } from '../../lib/prestamoWizardConstantes'
import Paso1DetallesPrestamo from '../../components/tenant/prestamoWizard/Paso1DetallesPrestamo'
import Paso2ClienteCobradorCaja from '../../components/tenant/prestamoWizard/Paso2ClienteCobradorCaja'
import Paso3GarantiaSolidario from '../../components/tenant/prestamoWizard/Paso3GarantiaSolidario'
import Paso4ResumenConfirmacion from '../../components/tenant/prestamoWizard/Paso4ResumenConfirmacion'
import ResumenCreditoCard from '../../components/tenant/prestamoWizard/ResumenCreditoCard'
import ModalGenerarLetraCambio from '../../components/tenant/ModalGenerarLetraCambio'
import { escribirDocumentoLetraCambio } from '../../lib/documentoLetraCambio'
import ModalConfirmacion from '../../components/tenant/ModalConfirmacion'
import { guardarBorradorPrestamo, obtenerBorradorPrestamo, limpiarBorradorPrestamo } from '../../lib/borradorPrestamo'
import AvisoLimitePlan from '../../components/tenant/AvisoLimitePlan'

const PASOS = [
  { numero: 1, etiqueta: 'Detalles del préstamo' },
  { numero: 2, etiqueta: 'Cliente, cobrador y caja' },
  { numero: 3, etiqueta: 'Garantía y solidario' },
  { numero: 4, etiqueta: 'Resumen y confirmación' },
]

// Cliente que llega precargado desde NuevoCliente.jsx tras "Guardar y crear
// préstamo" (ver ese archivo: navega a /prestamos/nuevo?clienteId=...).
function clienteDesdeQueryParams() {
  const params = new URLSearchParams(window.location.search)
  const clienteId = params.get('clienteId')
  if (!clienteId) return null
  return {
    id: clienteId,
    nombreCompleto: params.get('clienteNombre') || '',
    cedula: params.get('clienteCedula') || '',
    telefono: params.get('clienteTelefono') || '',
  }
}

export default function NuevoPrestamo() {
  const { tienePermiso, cargando: cargandoPermisos } = usePermisos()

  const [paso, setPaso] = useState(1)

  const [plantillas, setPlantillas] = useState([])
  const [plantillaId, setPlantillaId] = useState('')
  // fechaInicio por defecto es hoy — el operador la puede cambiar si el
  // préstamo arranca en otra fecha (decisión 2026-07-16).
  const [detalles, setDetalles] = useState(() => ({ ...DETALLES_VACIO, fechaInicio: fechaHoyISO() }))
  // Activado por defecto (decisión 2026-07-16) — facilita el manejo de
  // efectivo. Solo redondea la cuota/valor periódico mostrado y cobrado;
  // total a pagar y total de intereses del contrato quedan exactos.
  const [redondearCuotaMil, setRedondearCuotaMil] = useState(true)
  const [resumenSimulado, setResumenSimulado] = useState(null)

  const [cliente, setCliente] = useState(clienteDesdeQueryParams)
  const [cobradorId, setCobradorId] = useState('')
  const [cobradores, setCobradores] = useState([])
  const [cajaId, setCajaId] = useState('')
  const [cajas, setCajas] = useState([])

  const [garantia, setGarantia] = useState(GARANTIA_VACIA)
  const [documentos, setDocumentos] = useState([])
  const [tieneDeudorSolidario, setTieneDeudorSolidario] = useState(false)
  const [deudorSolidario, setDeudorSolidario] = useState(DEUDOR_SOLIDARIO_VACIO)

  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState('')
  // Crédito recién creado, en espera de que el operador decida si genera su
  // letra de cambio antes de salir del wizard (decisión 2026-07-17: se
  // pregunta siempre al confirmar, no solo cuando se llenó fechaLetra en el
  // paso 1 — ese campo es metadato del crédito, la letra es un documento aparte).
  const [creditoCreado, setCreditoCreado] = useState(null)

  // Confirmación antes de salir a crear un cliente a mitad del wizard (ver
  // Paso2ClienteCobradorCaja "Crear nuevo cliente" + lib/borradorPrestamo.js).
  const [mostrarModalCrearCliente, setMostrarModalCrearCliente] = useState(false)

  // Límite de préstamos activos del plan del tenant (decisión 2026-07-18): si
  // ya lo alcanzó, este wizard no debe cargarse — se muestra AvisoLimitePlan en
  // su lugar. El backend valida lo mismo de forma estricta en POST /creditos
  // (GET /api/tenant/plan/limite-prestamos), así que esto es solo para no
  // dejar entrar al operador a un formulario que de todas formas va a rechazar.
  // `activo` es un booleano (no la función `tienePermiso`, cuya identidad
  // cambia en cada render por el SSE de permisos), así que el hook solo
  // vuelve a consultar cuando el valor realmente cambia.
  const [estadoLimite] = useLimitePlan('prestamos', { activo: !cargandoPermisos && tienePermiso('creditos.crear') })

  useEffect(() => {
    apiFetch('/api/tenant/plantillas-credito').then(({ ok, datos }) => {
      if (ok) setPlantillas((datos.plantillas || []).filter(p => p.estado === 'ACTIVA'))
    })
    apiFetch('/api/tenant/colaboradores').then(({ ok, datos }) => {
      if (ok) setCobradores((datos.colaboradores || []).filter(c => c.rol?.nombre === 'COBRADOR' && c.estado === 'ACTIVO'))
    })
    apiFetch('/api/tenant/capital').then(({ ok, datos }) => {
      if (ok) setCajas(datos.capital || [])
    })
  }, [])

  // Restaura el avance guardado al salir a crear el cliente a mitad del wizard
  // (Paso2ClienteCobradorCaja "Crear nuevo cliente"). El cliente mismo ya llega
  // resuelto vía clienteDesdeQueryParams (mismo ?clienteId=... que ya usaba
  // NuevoCliente.jsx en su botón "Guardar y crear préstamo") — acá solo se
  // recupera todo lo demás que el operador ya había llenado.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).get('clienteId')) return
    const borrador = obtenerBorradorPrestamo()
    if (!borrador) return

    setPlantillaId(borrador.plantillaId)
    setDetalles(borrador.detalles)
    setRedondearCuotaMil(borrador.redondearCuotaMil)
    setCobradorId(borrador.cobradorId)
    setCajaId(borrador.cajaId)
    setGarantia(borrador.garantia)
    setDocumentos(borrador.documentos)
    setTieneDeudorSolidario(borrador.tieneDeudorSolidario)
    setDeudorSolidario(borrador.deudorSolidario)
    setPaso(2)
  }, [])

  // Simulación en vivo (debounced) — misma fórmula exacta que la creación real
  // (calculoCredito.js en el backend), nunca recalculada en el frontend.
  useEffect(() => {
    const monto = Number(detalles.montoInicial)
    const tasa = Number(detalles.tasaInteres)
    if (!(monto > 0) || !(tasa > 0) || !detalles.frecuenciaPago) {
      setResumenSimulado(null)
      return
    }

    let vigente = true
    const idTimeout = setTimeout(async () => {
      const { ok, datos } = await apiFetch('/api/tenant/creditos/simular', {
        method: 'POST',
        body: {
          montoInicial: monto,
          tasaInteres: tasa,
          numeroCuotas: Number(detalles.numeroCuotas) || 0,
          frecuenciaPago: detalles.frecuenciaPago,
          fechaInicio: detalles.fechaInicio || null,
          redondearCuotaMil,
        },
      })
      if (!vigente) return
      if (ok) setResumenSimulado(datos)
    }, 400)

    return () => { vigente = false; clearTimeout(idTimeout) }
  }, [detalles.montoInicial, detalles.tasaInteres, detalles.numeroCuotas, detalles.frecuenciaPago, detalles.fechaInicio, redondearCuotaMil])

  function cambiarPlantilla(id) {
    setPlantillaId(id)
    if (!id) return
    const plantilla = plantillas.find(p => p.id === id)
    if (!plantilla) return
    // Autocompleta pero nunca bloquea — el operador puede seguir editando
    // cualquier campo después (decisión 2026-07-16). numeroCuotas=0 en la
    // plantilla ("indefinidas") se copia tal cual — coincide exactamente con
    // el crédito de "solo intereses" (numeroCuotas=0 también en el crédito).
    setDetalles(d => ({
      ...d,
      tasaInteres: String(plantilla.tasaInteres),
      numeroCuotas: String(plantilla.numeroCuotas),
      frecuenciaPago: plantilla.frecuenciaPago,
    }))
  }

  function cambiarDetalle(campo, valor) {
    setDetalles(d => ({ ...d, [campo]: valor }))
  }
  function cambiarGarantia(campo, valor) {
    setGarantia(g => ({ ...g, [campo]: valor }))
  }
  function cambiarDeudorSolidario(campo, valor) {
    setDeudorSolidario(d => ({ ...d, [campo]: valor }))
  }

  // El cliente no existe y hay permiso para crearlo — se le pregunta si quiere
  // guardar el avance del préstamo antes de salir (decisión 2026-07-17): si
  // dice que sí, al volver con el cliente ya creado (?clienteId=..., mismo
  // flujo "Guardar y crear préstamo" de NuevoCliente.jsx) el wizard restaura
  // todo automáticamente en vez de empezar de cero.
  function crearClienteDesdeElWizard(guardarAvance) {
    if (guardarAvance) {
      guardarBorradorPrestamo({
        plantillaId, detalles, redondearCuotaMil, cobradorId, cajaId,
        garantia, documentos, tieneDeudorSolidario, deudorSolidario,
      })
    }
    setMostrarModalCrearCliente(false)
    navegarA('/clientes/nuevo')
  }

  const plantilla = plantillas.find(p => p.id === plantillaId)
  const monto = Number(detalles.montoInicial) || 0
  const minimo = plantilla ? Number(plantilla.montoMinimo) : 0
  const maximo = plantilla ? Number(plantilla.montoMaximo) : 0
  const montoFueraDeRango = plantilla && monto > 0 && ((minimo > 0 && monto < minimo) || (maximo > 0 && monto > maximo))

  // numeroCuotas acepta 0 (crédito de solo intereses) — solo se exige que el
  // campo no esté vacío y no sea negativo (decisión 2026-07-16).
  const paso1Valido = monto > 0 && Number(detalles.tasaInteres) > 0
    && detalles.numeroCuotas !== '' && Number(detalles.numeroCuotas) >= 0
    && !!detalles.frecuenciaPago && !!detalles.fechaInicio && !montoFueraDeRango
  const paso2Valido = !!cliente && !!cobradorId && !!cajaId
  const paso3Valido = !!garantia.tipo && !!garantia.descripcion.trim()
    && (!tieneDeudorSolidario || (!!deudorSolidario.nombreCompleto.trim() && !!deudorSolidario.cedula.trim() && !!deudorSolidario.telefono.trim()))

  function validoParaAvanzar(desde) {
    if (desde === 1) return paso1Valido
    if (desde === 2) return paso2Valido
    if (desde === 3) return paso3Valido
    return true
  }

  function siguiente() {
    if (!validoParaAvanzar(paso)) return
    setPaso(p => Math.min(4, p + 1))
    window.scrollTo(0, 0)
  }
  function anterior() {
    setPaso(p => Math.max(1, p - 1))
    window.scrollTo(0, 0)
  }
  function irAPaso(numero) {
    setPaso(numero)
    window.scrollTo(0, 0)
  }

  async function guardar() {
    setGuardando(true)
    setErrorGuardar('')
    try {
      const cuerpo = new FormData()
      cuerpo.append('plantillaId', plantillaId || '')
      cuerpo.append('clienteId', cliente.id)
      cuerpo.append('cobradorId', cobradorId)
      cuerpo.append('cajaId', cajaId)
      cuerpo.append('montoInicial', String(monto))
      cuerpo.append('tasaInteres', detalles.tasaInteres)
      cuerpo.append('numeroCuotas', detalles.numeroCuotas)
      cuerpo.append('frecuenciaPago', detalles.frecuenciaPago)
      cuerpo.append('fechaInicio', detalles.fechaInicio)
      cuerpo.append('fechaLetra', detalles.fechaLetra || '')
      cuerpo.append('redondearCuotaMil', String(redondearCuotaMil))
      cuerpo.append('garantia', JSON.stringify({
        tipo: garantia.tipo,
        descripcion: garantia.descripcion.trim(),
        valorEstimado: Number(garantia.valorEstimado) > 0 ? Number(garantia.valorEstimado) : null,
      }))
      cuerpo.append('deudorSolidario', tieneDeudorSolidario ? JSON.stringify({
        clienteId: deudorSolidario.clienteId || null,
        nombreCompleto: deudorSolidario.nombreCompleto.trim(),
        cedula: deudorSolidario.cedula.trim(),
        telefono: deudorSolidario.telefono.trim(),
        direccion: deudorSolidario.direccion || '',
        relacionConDeudor: deudorSolidario.relacionConDeudor,
        firmoDocumento: deudorSolidario.firmoDocumento,
      }) : '')
      documentos.forEach(d => cuerpo.append('garantiaArchivos', d.archivo))

      const { ok, datos } = await apiFetch('/api/tenant/creditos', { method: 'POST', body: cuerpo })
      if (!ok) {
        setErrorGuardar(datos.error || 'No se pudo guardar el préstamo.')
        setGuardando(false)
        return
      }
      // Crédito ya creado — el borrador (si había uno) ya cumplió su propósito.
      limpiarBorradorPrestamo()
      if (tienePermiso('creditos.generar_letra')) {
        setCreditoCreado({ id: datos.credito.id, clienteNombre: cliente.nombreCompleto, clienteCedula: cliente.cedula })
        setGuardando(false)
      } else {
        navegarA('/prestamos')
      }
    } catch {
      setErrorGuardar('Error de conexión. Intenta nuevamente.')
      setGuardando(false)
    }
  }

  // Se pasa `ventana` (ya abierta síncronamente por el modal, dentro del gesto
  // de clic) para que documentoLetraCambio.js la rellene apenas responde la
  // API — mismo patrón que Prestamos.jsx, reutilizado tal cual (CLAUDE.md §2).
  async function generarLetraCambio(datosLetra, ventana) {
    const { ok, datos: resp } = await apiFetch(`/api/tenant/creditos/${creditoCreado.id}/letra-cambio`, {
      method: 'POST',
      body: datosLetra,
    })
    if (!ok) throw new Error(resp.error || 'No se pudo generar la letra de cambio.')
    escribirDocumentoLetraCambio(ventana, resp)
  }

  if (!cargandoPermisos && !tienePermiso('creditos.crear')) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">
        <div className="rounded-2xl border border-outline-variant/50 bg-surface-lowest p-8 text-center shadow-card">
          <p className="text-on-surface-variant text-sm">No tienes permiso para crear préstamos.</p>
        </div>
      </div>
    )
  }

  if (estadoLimite.cargando) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-[3px] border-secondary-container/30 [border-top-color:var(--color-secondary)] animate-[girar_0.8s_linear_infinite]" />
      </div>
    )
  }

  if (estadoLimite.alcanzado) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">
        <AvisoLimitePlan usados={estadoLimite.usados} limite={estadoLimite.limite} />
      </div>
    )
  }

  const cajaSeleccionada = cajas.find(c => c.id === cajaId)

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">
      <div>
        <a href="/prestamos" className="text-[12px] text-on-surface-variant no-underline hover:text-on-background">Préstamos</a>
        <span className="text-[12px] text-on-surface-variant mx-1.5">/</span>
        <span className="text-[12px] text-on-background font-medium">Nuevo préstamo</span>
      </div>

      <div className="mt-4 mb-6 flex items-center gap-3">
        <span className="w-11 h-11 rounded-xl bg-secondary-container/25 text-secondary flex items-center justify-center shrink-0">
          <IcoMoneda size={20} />
        </span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-background tracking-tight m-0">Nuevo préstamo</h1>
          <p className="text-[13px] text-on-surface-variant mt-0.5 m-0">
            {paso < 4 ? 'Completa la información para registrar un nuevo préstamo en el sistema.' : 'Revisa la información y confirma el registro del préstamo.'}
          </p>
        </div>
      </div>

      {/* Indicador de pasos — mobile-first: en pantallas chicas los círculos se
          achican y las etiquetas se ocultan (solo el paso activo muestra texto),
          para que las 4 etapas siempre quepan en una sola fila sin desbordar. */}
      <div className="flex items-start mb-6 max-w-[820px] overflow-x-auto">
        {PASOS.map((p, i) => {
          const completado = p.numero < paso
          return (
            <div key={p.numero} className="flex items-center flex-1 last:flex-none min-w-[64px]">
              <button
                type="button"
                onClick={() => completado && irAPaso(p.numero)}
                disabled={!completado}
                className={`flex flex-col items-center gap-1.5 shrink-0 w-16 sm:w-20 bg-transparent border-none p-0 ${completado ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[12px] sm:text-[13px] font-bold shrink-0 transition-transform ${
                  completado ? 'bg-secondary text-on-primary hover:scale-110' : p.numero === paso ? 'bg-primary text-on-primary' : 'bg-surface-default text-on-surface-variant border border-outline-variant'
                }`}>
                  {completado ? <IcoCheck size={13} /> : p.numero}
                </span>
                <span className={`hidden sm:block text-[10.5px] font-semibold text-center leading-tight ${p.numero === paso ? 'text-on-background' : 'text-on-surface-variant'}`}>
                  {p.etiqueta}
                </span>
              </button>
              {i < PASOS.length - 1 && (
                <div className={`flex-1 h-[2px] mx-1 -mt-4 sm:-mt-5 ${p.numero < paso ? 'bg-secondary' : 'bg-outline-variant'}`} />
              )}
            </div>
          )
        })}
      </div>
      <p className="sm:hidden text-[12px] font-semibold text-on-background -mt-4 mb-5">{PASOS[paso - 1].etiqueta}</p>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
        <div>
          {paso === 1 && (
            <Paso1DetallesPrestamo
              plantillas={plantillas}
              plantillaId={plantillaId}
              onCambiarPlantilla={cambiarPlantilla}
              detalles={detalles}
              onCambiarDetalle={cambiarDetalle}
              redondearCuotaMil={redondearCuotaMil}
              onCambiarRedondeo={setRedondearCuotaMil}
            />
          )}
          {paso === 2 && (
            <Paso2ClienteCobradorCaja
              cliente={cliente}
              onSeleccionarCliente={setCliente}
              cobradorId={cobradorId}
              onCambiarCobrador={setCobradorId}
              cobradores={cobradores}
              cajaId={cajaId}
              onCambiarCaja={setCajaId}
              cajas={cajas}
              montoInicial={monto}
              onCrearCliente={() => setMostrarModalCrearCliente(true)}
            />
          )}
          {paso === 3 && (
            <Paso3GarantiaSolidario
              garantia={garantia}
              onCambiarGarantia={cambiarGarantia}
              documentos={documentos}
              onCambiarDocumentos={setDocumentos}
              tieneDeudorSolidario={tieneDeudorSolidario}
              onCambiarTieneDeudorSolidario={setTieneDeudorSolidario}
              deudorSolidario={deudorSolidario}
              onCambiarDeudorSolidario={cambiarDeudorSolidario}
            />
          )}
          {paso === 4 && (
            <Paso4ResumenConfirmacion
              plantillaNombre={plantilla?.nombre}
              detalles={detalles}
              resumen={resumenSimulado}
              redondearCuotaMil={redondearCuotaMil}
              cliente={cliente}
              cobrador={cobradores.find(c => c.id === cobradorId)}
              caja={cajaSeleccionada}
              garantia={garantia}
              documentos={documentos}
              tieneDeudorSolidario={tieneDeudorSolidario}
              deudorSolidario={deudorSolidario}
              onEditar={irAPaso}
            />
          )}

          {errorGuardar && <p className="text-[13px] text-error mt-3">{errorGuardar}</p>}

          <div className="flex items-center justify-between mt-5 gap-3 flex-wrap">
            <a
              href="/prestamos"
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
              {paso < 4 ? (
                <button
                  type="button"
                  onClick={siguiente}
                  disabled={!validoParaAvanzar(paso)}
                  className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-[13px] font-bold cursor-pointer hover:brightness-125 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1.5"
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={guardar}
                  disabled={guardando}
                  className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-[13px] font-bold cursor-pointer hover:brightness-125 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1.5"
                >
                  {guardando ? 'Guardando...' : 'Confirmar préstamo'} <IcoCheck size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <ResumenCreditoCard
            resumen={resumenSimulado}
            caja={cajaSeleccionada}
            montoInicial={monto}
            numeroCuotas={Number(detalles.numeroCuotas) || 0}
          />
        </div>
      </div>

      {creditoCreado && (
        <ModalGenerarLetraCambio
          credito={creditoCreado}
          onCerrar={() => navegarA('/prestamos')}
          onGenerar={generarLetraCambio}
        />
      )}

      {mostrarModalCrearCliente && (
        <ModalConfirmacion
          tipo="confirmacion"
          titulo="¿Guardar el avance de este préstamo?"
          mensaje="Vas a salir para crear el cliente. Si guardas el avance, al terminar de crearlo podrás retomar este préstamo automáticamente con sus datos."
          textoConfirmar="Sí, guardar y continuar"
          textoCancelar="No, continuar sin guardar"
          onConfirmar={() => crearClienteDesdeElWizard(true)}
          onCancelar={() => crearClienteDesdeElWizard(false)}
        />
      )}
    </div>
  )
}
