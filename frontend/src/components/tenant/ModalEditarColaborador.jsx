import { useEffect, useState } from 'react'
import Modal from './Modal'
import CampoTexto from './CampoTexto'
import CampoSelect from './CampoSelect'
import Casilla from './Casilla'
import BotonAccion from './BotonAccion'
import ModalConfirmacion from './ModalConfirmacion'
import { IcoMas, IcoCorreo } from './iconos'
import { ETIQUETAS_ROL } from '../../lib/roles'
import { apiFetch } from '../../lib/api'

const ETIQUETAS_MODULO = {
  CLIENTES: 'Clientes',
  CREDITOS: 'Créditos',
  COBROS: 'Cobros',
  EMPLEADOS: 'Empleados',
  CAPITAL: 'Capital',
  CAJA: 'Caja',
  TESORERIA: 'Tesorería',
  REPORTES: 'Reportes',
}

function agruparPorModulo(permisos) {
  const grupos = new Map()
  for (const p of permisos) {
    if (!grupos.has(p.modulo)) grupos.set(p.modulo, [])
    grupos.get(p.modulo).push(p)
  }
  return [...grupos.entries()]
}

function IcoChevron({ abierto }) {
  return (
    <svg
      width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-200 shrink-0 ${abierto ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// Acordeón DRY de un módulo de permisos — se despliega al tocar el encabezado
// para mostrar los checks, con un contador de "activos/total" siempre visible.
function AcordeonModulo({ titulo, items, abierto, onAlternar, onCambiarPermiso }) {
  const activos = items.filter(i => i.activo).length

  return (
    <div className="rounded-lg border border-outline-variant/50 overflow-hidden">
      <button
        type="button"
        onClick={onAlternar}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-3 bg-surface-default/60 hover:bg-surface-default border-none cursor-pointer text-left transition-colors"
      >
        <span className="text-[13px] font-semibold text-on-background">{titulo}</span>
        <span className="flex items-center gap-2 shrink-0">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${activos > 0 ? 'bg-secondary-container/30 text-on-secondary-container' : 'bg-outline-variant/20 text-on-surface-variant'}`}>
            {activos}/{items.length}
          </span>
          <IcoChevron abierto={abierto} />
        </span>
      </button>

      {abierto && (
        <div className="flex flex-col gap-2 px-3.5 py-3 border-t border-outline-variant/40 bg-surface-lowest">
          {items.map(p => (
            <Casilla key={p.codigo} etiqueta={p.nombre} marcado={p.activo} onChange={() => onCambiarPermiso(p.codigo)} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ModalEditarColaborador({ colaborador, onCerrar, onActualizado, onDesactivado }) {
  const [form, setForm] = useState({
    nombreCompleto: colaborador.nombreCompleto,
    cedula: colaborador.cedula,
    telefono: colaborador.telefono,
    email: colaborador.email,
    cargo: colaborador.cargo || '',
    rolId: colaborador.rol.id,
  })
  const [roles, setRoles] = useState([])
  const [permisos, setPermisos] = useState([])
  const [cargandoPermisos, setCargandoPermisos] = useState(true)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [confirmarGuardar, setConfirmarGuardar] = useState(false)
  const [confirmarEstado, setConfirmarEstado] = useState(false)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  const [moduloAbierto, setModuloAbierto] = useState(null)

  useEffect(() => {
    async function cargar() {
      const [rolesRes, permisosRes] = await Promise.all([
        apiFetch('/api/tenant/colaboradores/roles'),
        apiFetch(`/api/tenant/colaboradores/${colaborador.id}/permisos`),
      ])
      if (rolesRes.ok) setRoles(rolesRes.datos.roles || [])
      if (permisosRes.ok) setPermisos(permisosRes.datos.permisos || [])
      setCargandoPermisos(false)
    }
    cargar()
  }, [colaborador.id])

  function actualizarCampo(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
    setError('')
  }

  // Dependencia entre permisos de un mismo módulo: no tiene sentido poder crear/
  // editar/eliminar algo que no se puede ver. Al desactivar "ver" se desactiva todo
  // lo demás del módulo; al activar cualquier otro permiso, se activa "ver" también.
  function alternarPermiso(codigo) {
    setPermisos(actuales => {
      const permiso = actuales.find(p => p.codigo === codigo)
      if (!permiso) return actuales

      const nuevoActivo = !permiso.activo
      const esVer = codigo.endsWith('.ver')

      return actuales.map(p => {
        if (p.codigo === codigo) return { ...p, activo: nuevoActivo }
        if (p.modulo !== permiso.modulo) return p

        if (esVer && !nuevoActivo) return { ...p, activo: false }
        if (!esVer && nuevoActivo && p.codigo.endsWith('.ver')) return { ...p, activo: true }

        return p
      })
    })
  }

  function alternarModulo(modulo) {
    setModuloAbierto(actual => (actual === modulo ? null : modulo))
  }

  async function guardarCambios() {
    setConfirmarGuardar(false)
    setGuardando(true)
    setError('')
    try {
      const { ok: okDatos, datos: datosRes } = await apiFetch(`/api/tenant/colaboradores/${colaborador.id}`, {
        method: 'PATCH',
        body: form,
      })
      if (!okDatos) { setError(datosRes.error || 'No se pudieron guardar los datos.'); return }

      if (!colaborador.esSuperAdmin) {
        const { ok: okPermisos, datos: datosPermisos } = await apiFetch(`/api/tenant/colaboradores/${colaborador.id}/permisos`, {
          method: 'PUT',
          body: { permisos: permisos.map(p => ({ codigo: p.codigo, activo: p.activo })) },
        })
        if (!okPermisos) { setError(datosPermisos.error || 'No se pudieron guardar los permisos.'); return }
      }

      onActualizado(datosRes.colaborador)
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setGuardando(false)
    }
  }

  async function confirmarCambioEstado() {
    setConfirmarEstado(false)
    setCambiandoEstado(true)
    try {
      const { ok, datos } = await apiFetch(`/api/tenant/colaboradores/${colaborador.id}/estado`, { method: 'PATCH' })
      if (ok) onDesactivado(datos.colaborador)
    } finally {
      setCambiandoEstado(false)
    }
  }

  const activo = colaborador.estado === 'ACTIVO'
  const grupos = agruparPorModulo(permisos)

  return (
    <>
      <Modal
        titulo="Editar datos y permisos"
        subtitulo={colaborador.nombreCompleto}
        onCerrar={onCerrar}
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
                variante="primario"
                onClick={() => setConfirmarGuardar(true)}
                disabled={guardando}
                cargando={guardando}
                icono={<IcoMas />}
                className="flex-1"
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </BotonAccion>
            </div>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Izquierda — datos */}
          <div className="flex flex-col gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant">Datos del colaborador</p>

            <CampoTexto etiqueta="Nombre completo" valor={form.nombreCompleto} onChange={v => actualizarCampo('nombreCompleto', v)} requerido />

            <div className="grid grid-cols-2 gap-3">
              <CampoTexto etiqueta="Cédula" valor={form.cedula} onChange={v => actualizarCampo('cedula', v)} requerido />
              <CampoTexto etiqueta="Teléfono" valor={form.telefono} onChange={v => actualizarCampo('telefono', v)} requerido />
            </div>

            <CampoTexto etiqueta="Correo electrónico" tipo="email" icono={<IcoCorreo />} valor={form.email} onChange={v => actualizarCampo('email', v)} requerido />
            <CampoTexto etiqueta="Cargo (opcional)" valor={form.cargo} onChange={v => actualizarCampo('cargo', v)} />

            <CampoSelect
              etiqueta="Rol"
              valor={form.rolId}
              onChange={v => actualizarCampo('rolId', v)}
              opciones={roles.map(r => ({ value: r.id, label: ETIQUETAS_ROL[r.nombre] || r.nombre }))}
              requerido
            />

            {!colaborador.esSuperAdmin && (
              <div className="mt-2 pt-4 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setConfirmarEstado(true)}
                  disabled={cambiandoEstado}
                  className={`w-full py-2.5 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-50 ${
                    activo ? 'bg-error/10 text-error hover:bg-error/15' : 'bg-secondary/10 text-secondary hover:bg-secondary/15'
                  }`}
                >
                  {cambiandoEstado ? '...' : activo ? 'Desactivar colaborador' : 'Activar colaborador'}
                </button>
              </div>
            )}
          </div>

          {/* Derecha — permisos */}
          <div className="flex flex-col gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant">Permisos asignados</p>

            {colaborador.esSuperAdmin ? (
              <p className="text-[13px] text-on-surface-variant">El super admin siempre tiene acceso total — no se pueden editar permisos individuales.</p>
            ) : cargandoPermisos ? (
              <p className="text-[13px] text-on-surface-variant">Cargando permisos...</p>
            ) : (
              <div className="flex flex-col gap-2">
                {grupos.map(([modulo, items]) => (
                  <AcordeonModulo
                    key={modulo}
                    titulo={ETIQUETAS_MODULO[modulo] || modulo}
                    items={items}
                    abierto={moduloAbierto === modulo}
                    onAlternar={() => alternarModulo(modulo)}
                    onCambiarPermiso={alternarPermiso}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {confirmarGuardar && (
        <ModalConfirmacion
          tipo="confirmacion"
          titulo="¿Guardar los cambios?"
          mensaje="Se actualizarán los datos y los permisos asignados a este colaborador."
          textoConfirmar="Sí, guardar"
          onConfirmar={guardarCambios}
          onCancelar={() => setConfirmarGuardar(false)}
        />
      )}

      {confirmarEstado && (
        <ModalConfirmacion
          tipo="advertencia"
          titulo={activo ? `¿Desactivar a ${colaborador.nombreCompleto}?` : `¿Activar a ${colaborador.nombreCompleto}?`}
          mensaje={activo
            ? 'El colaborador no podrá iniciar sesión en el panel mientras esté inactivo.'
            : 'El colaborador podrá volver a iniciar sesión en el panel.'}
          textoConfirmar={activo ? 'Sí, desactivar' : 'Sí, activar'}
          onConfirmar={confirmarCambioEstado}
          onCancelar={() => setConfirmarEstado(false)}
        />
      )}
    </>
  )
}
