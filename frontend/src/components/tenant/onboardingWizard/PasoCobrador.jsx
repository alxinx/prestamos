import { useEffect, useState } from 'react'
import CampoTexto from '../CampoTexto'
import BotonAccion from '../BotonAccion'
import { IcoCorreo, IcoCheck, IcoX, IcoCandado } from '../iconos'
import { apiFetch } from '../../../lib/api'

const FORM_INICIAL = { nombreCompleto: '', cedula: '', telefono: '', email: '' }

const PUEDE = ['Registrar cobros', 'Consultar clientes', 'Registrar pagos']
const NO_PUEDE = ['Configuración', 'Reportes financieros', 'Gestionar capital']

// Paso 2: crea el primer Cobrador reusando exactamente crearColaborador (mismo
// endpoint que Colaboradores.jsx) — envía correo de activación, sin contraseña
// visible en pantalla (decisión 2026-07-18: no se construyó un flujo nuevo de
// contraseña temporal). Por eso Email es obligatorio acá (a diferencia del
// mockup): sin correo esa persona nunca podría activar su cuenta. También se
// pide Cédula, que crearColaborador siempre exige. El rol se resuelve solo
// (busca 'COBRADOR' en el catálogo de roles del tenant, sembrado siempre en la
// activación) — nunca se muestra un selector.
export default function PasoCobrador({ onCompletado }) {
  const [form, setForm] = useState(FORM_INICIAL)
  const [rolCobradorId, setRolCobradorId] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    apiFetch('/api/tenant/colaboradores/roles').then(({ ok, datos }) => {
      if (ok) {
        const cobrador = (datos.roles || []).find(r => r.nombre === 'COBRADOR')
        setRolCobradorId(cobrador?.id || '')
      }
    })
  }, [])

  function actualizar(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
    setError('')
  }

  async function continuar(e) {
    e.preventDefault()
    if (!form.nombreCompleto.trim() || !form.cedula.trim() || !form.telefono.trim() || !form.email.trim()) {
      setError('Completa todos los campos.')
      return
    }
    if (!rolCobradorId) {
      setError('No se pudo resolver el rol de Cobrador. Intenta de nuevo.')
      return
    }
    setGuardando(true)
    setError('')
    try {
      const cuerpo = new FormData()
      cuerpo.append('nombreCompleto', form.nombreCompleto)
      cuerpo.append('cedula', form.cedula)
      cuerpo.append('telefono', form.telefono)
      cuerpo.append('email', form.email)
      cuerpo.append('rolId', rolCobradorId)

      const { ok, datos } = await apiFetch('/api/tenant/colaboradores', { method: 'POST', body: cuerpo })
      if (!ok) { setError(datos.error || 'No se pudo crear el cobrador.'); return }
      onCompletado(datos.colaborador)
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary mb-1">Paso 2 de 2</p>
      <h1 className="text-[24px] font-bold text-on-background m-0 mb-2 tracking-tight">Ahora agrega un cobrador</h1>
      <p className="text-[13.5px] text-on-surface-variant mb-6">
        El cobrador podrá registrar cobros desde su celular y mantener al día la información.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 items-start">
        <form onSubmit={continuar} className="bg-surface-lowest rounded-2xl border border-outline-variant/50 shadow-card p-6 flex flex-col md:flex-row gap-6">
          <img
            src="/iconos/cobrador.webp"
            alt=""
            className="hidden md:block self-start w-[110px] h-auto shrink-0 object-contain select-none pointer-events-none"
          />

          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <CampoTexto
              etiqueta="Nombre completo"
              placeholder="Ej. María Fernanda López"
              valor={form.nombreCompleto}
              onChange={v => actualizar('nombreCompleto', v)}
              requerido
            />
            <div className="grid grid-cols-2 gap-3">
              <CampoTexto etiqueta="Cédula" placeholder="Ej. 1020304050" valor={form.cedula} onChange={v => actualizar('cedula', v)} requerido />
              <CampoTexto etiqueta="Teléfono" placeholder="Ej. 300 123 4567" valor={form.telefono} onChange={v => actualizar('telefono', v)} requerido />
            </div>
            <CampoTexto
              etiqueta="Correo electrónico"
              tipo="email"
              icono={<IcoCorreo />}
              placeholder="cobrador@correo.com"
              valor={form.email}
              onChange={v => actualizar('email', v)}
              requerido
            />

            <div className="rounded-xl bg-on-tertiary-container/10 p-3.5 flex items-start gap-2.5">
              <span className="text-on-tertiary-container shrink-0 mt-0.5"><IcoCandado size={14} /></span>
              <p className="text-[12px] text-on-surface-variant m-0">
                Le enviaremos un correo de activación para que cree su propia contraseña.
              </p>
            </div>

            {error && (
              <p className="text-[13px] text-on-error-container bg-error-container rounded-lg px-3 py-2">{error}</p>
            )}

            <BotonAccion type="submit" disabled={guardando} cargando={guardando} className="mt-1 self-start px-6">
              {guardando ? 'Enviando...' : 'Finalizar configuración'}
            </BotonAccion>
          </div>
        </form>

        <div className="rounded-2xl bg-surface-lowest border border-outline-variant/50 shadow-card p-5">
          <p className="text-[13px] font-bold text-on-background m-0 mb-3">Este usuario podrá</p>
          <div className="flex flex-col gap-2 mb-4">
            {PUEDE.map(t => (
              <div key={t} className="flex items-center gap-2 text-[12.5px] text-on-background">
                <span className="text-secondary"><IcoCheck size={13} /></span>{t}
              </div>
            ))}
          </div>
          <p className="text-[13px] font-bold text-on-background m-0 mb-3">No podrá</p>
          <div className="flex flex-col gap-2">
            {NO_PUEDE.map(t => (
              <div key={t} className="flex items-center gap-2 text-[12.5px] text-on-surface-variant">
                <span className="text-error"><IcoX size={13} /></span>{t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
