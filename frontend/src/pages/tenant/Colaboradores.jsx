import { useEffect, useState } from 'react'
import TarjetaPanel from '../../components/tenant/TarjetaPanel'
import BotonAccion from '../../components/tenant/BotonAccion'
import CampoFormulario, { claseInput } from '../../components/tenant/CampoFormulario'
import TarjetaColaborador from '../../components/tenant/TarjetaColaborador'
import { IcoMas } from '../../components/tenant/iconos'

function IcoPersonas() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

const ETIQUETAS_ROL = {
  ADMINISTRADOR: 'Administrador',
  SECRETARIA: 'Secretaria',
  AUDITOR: 'Auditor',
  COBRADOR: 'Cobrador',
}

const FORM_INICIAL = { nombreCompleto: '', cedula: '', telefono: '', email: '', password: '', cargo: '', rolId: '' }

export default function Colaboradores() {
  const [roles, setRoles] = useState([])
  const [colaboradores, setColaboradores] = useState([])
  const [form, setForm] = useState(FORM_INICIAL)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [sinPermiso, setSinPermiso] = useState(false)
  const [cambiandoId, setCambiandoId] = useState(null)

  useEffect(() => {
    async function cargarDatos() {
      const [rolesRes, listaRes] = await Promise.all([
        fetch('/api/tenant/colaboradores/roles', { credentials: 'include' }),
        fetch('/api/tenant/colaboradores', { credentials: 'include' }),
      ])

      if (rolesRes.status === 403 || listaRes.status === 403) {
        setSinPermiso(true)
        setCargando(false)
        return
      }

      const rolesDatos = await rolesRes.json()
      const listaDatos = await listaRes.json()
      setRoles(rolesDatos.roles || [])
      setColaboradores(listaDatos.colaboradores || [])
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
    setEnviando(true)
    try {
      const res = await fetch('/api/tenant/colaboradores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      const datos = await res.json()
      if (!res.ok) { setError(datos.error || 'No se pudo crear el colaborador.'); return }
      setColaboradores(c => [datos.colaborador, ...c])
      setForm(FORM_INICIAL)
      setExito(true)
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setEnviando(false)
    }
  }

  async function manejarCambiarEstado(id) {
    setCambiandoId(id)
    try {
      const res = await fetch(`/api/tenant/colaboradores/${id}/estado`, { method: 'PATCH', credentials: 'include' })
      const datos = await res.json()
      if (res.ok) setColaboradores(c => c.map(col => (col.id === id ? datos.colaborador : col)))
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

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">

      {/* Encabezado */}
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1 text-secondary">Panel</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-on-background tracking-tight">Colaboradores</h1>
      </div>

      {/* Mobile-first: una sola columna hasta desktop (lg), donde se parte en 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-4 items-start">

        {/* Columna 1 — Formulario */}
        <TarjetaPanel
          icono={<IcoMas />}
          iconoClases="bg-secondary/10 text-secondary"
          titulo="Nuevo colaborador"
          subtitulo="Crear un acceso al panel"
        >
          <form onSubmit={manejarSubmit} noValidate className="flex flex-col gap-4">
            <CampoFormulario etiqueta="Nombre completo">
              <input
                className={claseInput}
                value={form.nombreCompleto}
                onChange={e => actualizarCampo('nombreCompleto', e.target.value)}
                autoComplete="name"
                required
              />
            </CampoFormulario>

            <div className="grid grid-cols-2 gap-3">
              <CampoFormulario etiqueta="Cédula">
                <input
                  className={claseInput}
                  value={form.cedula}
                  onChange={e => actualizarCampo('cedula', e.target.value)}
                  required
                />
              </CampoFormulario>
              <CampoFormulario etiqueta="Teléfono">
                <input
                  className={claseInput}
                  value={form.telefono}
                  onChange={e => actualizarCampo('telefono', e.target.value)}
                  autoComplete="tel"
                  required
                />
              </CampoFormulario>
            </div>

            <CampoFormulario etiqueta="Correo electrónico">
              <input
                type="email"
                className={claseInput}
                value={form.email}
                onChange={e => actualizarCampo('email', e.target.value)}
                autoComplete="email"
                required
              />
            </CampoFormulario>

            <CampoFormulario etiqueta="Contraseña temporal">
              <input
                type="password"
                className={claseInput}
                value={form.password}
                onChange={e => actualizarCampo('password', e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </CampoFormulario>

            <CampoFormulario etiqueta="Cargo (opcional)">
              <input
                className={claseInput}
                value={form.cargo}
                onChange={e => actualizarCampo('cargo', e.target.value)}
              />
            </CampoFormulario>

            <CampoFormulario etiqueta="Rol">
              <select
                className={claseInput}
                value={form.rolId}
                onChange={e => actualizarCampo('rolId', e.target.value)}
                required
              >
                <option value="" disabled>Selecciona un rol</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{ETIQUETAS_ROL[r.nombre] || r.nombre}</option>
                ))}
              </select>
            </CampoFormulario>

            {error && (
              <p className="text-[13px] text-on-error-container bg-error-container rounded-lg px-3 py-2">{error}</p>
            )}
            {exito && (
              <p className="text-[13px] text-on-secondary-container bg-secondary-container/25 rounded-lg px-3 py-2">
                Colaborador creado correctamente.
              </p>
            )}

            <BotonAccion type="submit" disabled={enviando} icono={<IcoMas />} className="w-full mt-1">
              {enviando ? 'Creando...' : 'Crear colaborador'}
            </BotonAccion>
          </form>
        </TarjetaPanel>

        {/* Columna 2 — Listado */}
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

      </div>
    </div>
  )
}
