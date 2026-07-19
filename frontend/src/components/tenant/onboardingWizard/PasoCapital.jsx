import { useState } from 'react'
import CampoTexto from '../CampoTexto'
import CampoMoneda from '../CampoMoneda'
import BotonAccion from '../BotonAccion'
import { IcoInfo, IcoEdificio } from '../iconos'
import { apiFetch } from '../../../lib/api'
import { formatearPrecio } from '../../../lib/formato'

const FORM_INICIAL = { nombre: 'Capital Principal', valorTotal: 0 }

// Paso 1: crea el primer Capital. No pide "socio responsable" (a diferencia
// del panel normal de Capital.jsx) — el backend (crearCapital en
// capital.service.js) usa/crea automáticamente un socio vinculado al propio
// administrador cuando no se manda socioId. Tampoco pide "descripción": ese
// campo no existe en el modelo Caja.
export default function PasoCapital({ onCompletado }) {
  const [form, setForm] = useState(FORM_INICIAL)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  function actualizar(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
    setError('')
  }

  async function continuar(e) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.valorTotal) {
      setError('Completa el nombre y el valor del capital.')
      return
    }
    setGuardando(true)
    setError('')
    try {
      const { ok, datos } = await apiFetch('/api/tenant/capital', {
        method: 'POST',
        body: { nombre: form.nombre.trim(), valorTotal: Number(form.valorTotal) },
      })
      if (!ok) { setError(datos.error || 'No se pudo crear el capital.'); return }
      onCompletado(datos.capital)
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary mb-1">Paso 1 de 2</p>
      <h1 className="text-[24px] font-bold text-on-background m-0 mb-2 tracking-tight">Crea tu primer Capital</h1>
      <p className="text-[13.5px] text-on-surface-variant mb-6">
        Este será el dinero disponible desde donde se desembolsarán los préstamos.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 items-start">
        <form onSubmit={continuar} className="bg-surface-lowest rounded-2xl border border-outline-variant/50 shadow-card p-6 flex flex-col md:flex-row gap-6">
          <img
            src="/iconos/caja fuerte.webp"
            alt=""
            className="hidden md:block self-start w-[130px] h-auto shrink-0 object-contain select-none pointer-events-none"
          />

          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <CampoTexto
              etiqueta="Nombre del capital"
              placeholder="Ej. Capital Principal"
              valor={form.nombre}
              onChange={v => actualizar('nombre', v)}
              requerido
            />
            <CampoMoneda etiqueta="Valor disponible" valor={form.valorTotal} onChange={v => actualizar('valorTotal', v)} />

            {error && (
              <p className="text-[13px] text-on-error-container bg-error-container rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="rounded-xl bg-secondary-container/15 p-3.5 flex items-start gap-2.5">
              <span className="text-secondary shrink-0 mt-0.5"><IcoInfo size={15} /></span>
              <div>
                <p className="text-[12.5px] font-bold text-on-background m-0">¿Qué es un capital?</p>
                <p className="text-[12px] text-on-surface-variant m-0 mt-0.5">Es el dinero desde donde se desembolsarán los préstamos.</p>
              </div>
            </div>

            <BotonAccion type="submit" disabled={guardando} cargando={guardando} className="mt-1 self-start px-6">
              {guardando ? 'Creando...' : 'Continuar'}
            </BotonAccion>
          </div>
        </form>

        <div className="rounded-2xl bg-surface-lowest border border-outline-variant/50 shadow-card p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-secondary-container/25 text-secondary flex items-center justify-center mx-auto mb-3">
            <IcoEdificio size={22} />
          </div>
          <p className="text-[13px] font-semibold text-on-background m-0 mb-1">Vista previa</p>
          <p className="text-[24px] font-bold text-secondary m-0 mb-4">{formatearPrecio(form.valorTotal || 0)}</p>
          <div className="flex flex-col gap-2 text-left text-[12.5px]">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Nombre</span>
              <span className="font-semibold text-on-background truncate ml-2">{form.nombre || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Disponible</span>
              <span className="font-semibold text-on-background">{formatearPrecio(form.valorTotal || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
