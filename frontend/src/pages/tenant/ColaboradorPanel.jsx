import { useEffect, useState } from 'react'
import PanelCobrador from '../../components/tenant/PanelCobrador'
import ModalEditarColaborador from '../../components/tenant/ModalEditarColaborador'
import SeccionDocumentosColaborador from '../../components/tenant/SeccionDocumentosColaborador'
import { ETIQUETAS_ROL } from '../../lib/roles'
import { apiFetch } from '../../lib/api'

function idDeUrl() {
  const partes = window.location.pathname.split('/')
  return partes[2] // /colaboradores/:id/panel
}

function IcoEditar() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  )
}

export default function ColaboradorPanel() {
  const id = idDeUrl()
  const [colaborador, setColaborador] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)

  async function cargar() {
    setCargando(true)
    const { ok, datos } = await apiFetch(`/api/tenant/colaboradores/${id}`)
    if (!ok) { setError(datos.error || 'No se pudo cargar el colaborador.'); setCargando(false); return }
    setColaborador(datos.colaborador)
    setCargando(false)
  }

  useEffect(() => { cargar() }, [id])

  if (cargando) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">
        <p className="text-[13px] text-on-surface-variant">Cargando...</p>
      </div>
    )
  }

  if (error || !colaborador) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">
        <a href="/colaboradores" className="text-[13px] text-on-surface-variant no-underline hover:text-on-background">← Volver a colaboradores</a>
        <div className="mt-4 rounded-2xl border border-outline-variant/50 bg-surface-lowest p-8 text-center shadow-card">
          <p className="text-on-surface-variant text-sm">{error || 'Colaborador no encontrado.'}</p>
        </div>
      </div>
    )
  }

  const rolNombre = colaborador.rol.nombre

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-7 pb-12 min-h-full">
      <a href="/colaboradores" className="inline-block text-[13px] text-on-surface-variant no-underline hover:text-on-background mb-4">
        ← Volver a colaboradores
      </a>

      {/* Encabezado */}
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1 text-secondary">
            {ETIQUETAS_ROL[rolNombre] || rolNombre}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-background tracking-tight">
            Panel control de {colaborador.nombreCompleto.split(' ')[0]}
          </h1>
        </div>

        <button
          onClick={() => setMostrarModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary text-[13px] font-semibold hover:brightness-125 transition-all"
        >
          <IcoEditar /> Editar datos y permisos
        </button>
      </div>

      {rolNombre === 'COBRADOR' ? (
        <PanelCobrador colaborador={colaborador} />
      ) : (
        <div className="rounded-2xl border border-outline-variant/50 bg-surface-lowest p-8 text-center shadow-card">
          <p className="text-on-surface-variant text-sm">
            El panel para el rol {ETIQUETAS_ROL[rolNombre] || rolNombre} está en construcción.
          </p>
        </div>
      )}

      <div className="mt-6">
        <SeccionDocumentosColaborador empleadoId={colaborador.id} />
      </div>

      {mostrarModal && (
        <ModalEditarColaborador
          colaborador={colaborador}
          onCerrar={() => setMostrarModal(false)}
          onActualizado={c => { setColaborador(c); setMostrarModal(false) }}
          onDesactivado={() => { window.location.href = '/colaboradores' }}
        />
      )}
    </div>
  )
}
