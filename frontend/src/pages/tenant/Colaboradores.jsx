import { useEffect, useState } from 'react'
import useTamanoPantalla from '../../hooks/useTamanoPantalla'
import TarjetaPanel from '../../components/tenant/TarjetaPanel'
import BotonAccion from '../../components/tenant/BotonAccion'
import CampoTexto from '../../components/tenant/CampoTexto'
import CampoSelect from '../../components/tenant/CampoSelect'
import SelectorDocumentos from '../../components/tenant/SelectorDocumentos'
import TarjetaColaborador from '../../components/tenant/TarjetaColaborador'
import { IcoMas, IcoCorreo } from '../../components/tenant/iconos'
import { ETIQUETAS_ROL } from '../../lib/roles'
import { apiFetch } from '../../lib/api'

function IcoPersonas() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

const FORM_INICIAL = { nombreCompleto: '', cedula: '', telefono: '', email: '', rolId: '' }

export default function Colaboradores() {
  const esMobil = useTamanoPantalla()
  const [mostrarFormMobil, setMostrarFormMobil] = useState(false)
  const [roles, setRoles] = useState([])
  const [colaboradores, setColaboradores] = useState([])
  const [form, setForm] = useState(FORM_INICIAL)
  const [documentos, setDocumentos] = useState([])
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const [avisoDocumentos, setAvisoDocumentos] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [sinPermiso, setSinPermiso] = useState(false)
  const [cambiandoId, setCambiandoId] = useState(null)

  useEffect(() => {
    async function cargarDatos() {
      const [rolesRes, listaRes] = await Promise.all([
        apiFetch('/api/tenant/colaboradores/roles'),
        apiFetch('/api/tenant/colaboradores'),
      ])

      if (rolesRes.status === 403 || listaRes.status === 403) {
        setSinPermiso(true)
        setCargando(false)
        return
      }

      setRoles(rolesRes.datos.roles || [])
      setColaboradores(listaRes.datos.colaboradores || [])
      setCargando(false)
    }
    cargarDatos()
  }, [])

  function actualizarCampo(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
    setError('')
    setExito(false)
  }

  async function manejarSubmit(e) {
    e.preventDefault()
    setError('')
    setExito(false)
    setAvisoDocumentos('')
    setEnviando(true)
    try {
      const cuerpo = new FormData()
      cuerpo.append('nombreCompleto', form.nombreCompleto)
      cuerpo.append('cedula', form.cedula)
      cuerpo.append('telefono', form.telefono)
      cuerpo.append('email', form.email)
      cuerpo.append('rolId', form.rolId)
      cuerpo.append('documentosMeta', JSON.stringify(documentos.map(d => ({ nombre: d.nombre }))))
      documentos.forEach(d => cuerpo.append('documentosArchivos', d.archivo))

      const { ok, datos } = await apiFetch('/api/tenant/colaboradores', { method: 'POST', body: cuerpo })
      if (!ok) { setError(datos.error || 'No se pudo crear el colaborador.'); return }
      setColaboradores(c => [datos.colaborador, ...c])
      setForm(FORM_INICIAL)
      setDocumentos([])
      setExito(true)
      if (datos.documentosFallidos?.length) {
        setAvisoDocumentos(`No se pudieron subir: ${datos.documentosFallidos.map(d => d.nombre).join(', ')}.`)
      }
      if (esMobil) setMostrarFormMobil(false)
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setEnviando(false)
    }
  }

  async function manejarCambiarEstado(id) {
    setCambiandoId(id)
    try {
      const { ok, datos } = await apiFetch(`/api/tenant/colaboradores/${id}/estado`, { method: 'PATCH' })
      if (ok) setColaboradores(c => c.map(col => (col.id === id ? datos.colaborador : col)))
    } finally {
      setCambiandoId(null)
    }
  }

  if (sinPermiso) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">
        <div className="rounded-2xl border border-outline-variant/50 bg-surface-lowest p-8 text-center shadow-card">
          <p className="text-on-surface-variant text-sm">No tienes permiso para ver esta sección.</p>
        </div>
      </div>
    )
  }

  const formulario = (
    <TarjetaPanel
      icono={<IcoMas />}
      iconoClases="bg-secondary/10 text-secondary"
      titulo="Nuevo colaborador"
      subtitulo="Crear un acceso al panel"
    >
      <form onSubmit={manejarSubmit} noValidate className="flex flex-col gap-4">
        <CampoTexto
          etiqueta="Nombre completo"
          placeholder="Ej. Juan Pérez"
          valor={form.nombreCompleto}
          onChange={v => actualizarCampo('nombreCompleto', v)}
          autoComplete="name"
          requerido
        />

        <div className="grid grid-cols-2 gap-3">
          <CampoTexto
            etiqueta="Cédula"
            placeholder="Ej. 1020304050"
            valor={form.cedula}
            onChange={v => actualizarCampo('cedula', v)}
            requerido
          />
          <CampoTexto
            etiqueta="Teléfono"
            placeholder="Ej. 3001234567"
            valor={form.telefono}
            onChange={v => actualizarCampo('telefono', v)}
            autoComplete="tel"
            requerido
          />
        </div>

        <CampoTexto
          etiqueta="Correo electrónico"
          tipo="email"
          icono={<IcoCorreo />}
          placeholder="usuario@gotapay.com"
          valor={form.email}
          onChange={v => actualizarCampo('email', v)}
          autoComplete="email"
          requerido
        />

        <CampoSelect
          etiqueta="Rol"
          placeholder="Selecciona un rol"
          valor={form.rolId}
          onChange={v => actualizarCampo('rolId', v)}
          opciones={roles.map(r => ({ value: r.id, label: ETIQUETAS_ROL[r.nombre] || r.nombre }))}
          requerido
        />

        <SelectorDocumentos documentos={documentos} onCambiar={setDocumentos} />

        {error && (
          <p className="text-[13px] text-on-error-container bg-error-container rounded-lg px-3 py-2">{error}</p>
        )}
        {exito && (
          <p className="text-[13px] text-on-secondary-container bg-secondary-container/25 rounded-lg px-3 py-2">
            Colaborador creado correctamente. Se le envió un correo para que active su cuenta.
          </p>
        )}
        {avisoDocumentos && (
          <p className="text-[13px] text-on-error-container bg-error-container rounded-lg px-3 py-2">{avisoDocumentos}</p>
        )}

        <BotonAccion type="submit" disabled={enviando} cargando={enviando} icono={<IcoMas />} className="w-full mt-1">
          {enviando ? 'Creando...' : 'Crear colaborador'}
        </BotonAccion>
      </form>
    </TarjetaPanel>
  )

  const listado = (
    <TarjetaPanel
      icono={<IcoPersonas />}
      iconoClases="bg-primary/10 text-primary"
      titulo="Equipo"
      subtitulo={cargando ? 'Cargando...' : `${colaboradores.length} colaborador${colaboradores.length === 1 ? '' : 'es'}`}
    >
      {cargando ? (
        <p className="text-[13px] text-on-surface-variant">Cargando colaboradores...</p>
      ) : colaboradores.length === 0 ? (
        <p className="text-[13px] text-on-surface-variant">Aún no hay colaboradores registrados.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {colaboradores.map(c => (
            <TarjetaColaborador
              key={c.id}
              colaborador={c}
              onCambiarEstado={manejarCambiarEstado}
              cambiando={cambiandoId === c.id}
            />
          ))}
        </div>
      )}
    </TarjetaPanel>
  )

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">

      {/* Encabezado */}
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1 text-secondary">Panel</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-background tracking-tight">Colaboradores</h1>
        </div>
        {esMobil && !mostrarFormMobil && (
          <BotonAccion onClick={() => setMostrarFormMobil(true)} icono={<IcoMas />}>
            Crear colaborador
          </BotonAccion>
        )}
      </div>

      {esMobil ? (
        mostrarFormMobil ? (
          <div>
            <button
              onClick={() => setMostrarFormMobil(false)}
              className="flex items-center gap-1.5 mb-4 bg-transparent border-none text-on-surface-variant text-[13px] cursor-pointer font-sans p-0"
            >
              ← Volver al listado
            </button>
            {formulario}
          </div>
        ) : (
          listado
        )
      ) : (
        /* Desktop/tablet: dos columnas 35% / 65% desde lg */
        <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-4 items-start">
          {formulario}
          {listado}
        </div>
      )}
    </div>
  )
}
