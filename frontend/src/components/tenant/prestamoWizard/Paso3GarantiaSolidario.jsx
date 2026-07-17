import { useEffect, useState } from 'react'
import CampoTexto from '../CampoTexto'
import CampoMoneda from '../CampoMoneda'
import CampoSelect from '../CampoSelect'
import CampoTextarea from '../CampoTextarea'
import Interruptor from '../Interruptor'
import SelectorDocumentos from '../SelectorDocumentos'
import { ETIQUETA_RELACION } from '../../../lib/clienteWizardConstantes'
import { TIPOS_GARANTIA } from '../../../lib/prestamoWizardConstantes'
import { apiFetch } from '../../../lib/api'

const RELACIONES = Object.entries(ETIQUETA_RELACION).map(([value, label]) => ({ value, label }))

function IcoEscudo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  )
}

function IcoBuscarChico() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

// Paso 3 — garantía del préstamo (siempre requerida) y deudor solidario
// (opcional). Documentos reutiliza SelectorDocumentos/subirDocumento (misma
// validación webp/tamaño ya usada por clientes y colaboradores — CLAUDE.md §9).
export default function Paso3GarantiaSolidario({
  garantia, onCambiarGarantia, documentos, onCambiarDocumentos,
  tieneDeudorSolidario, onCambiarTieneDeudorSolidario,
  deudorSolidario, onCambiarDeudorSolidario,
}) {
  const [buscandoCedula, setBuscandoCedula] = useState(false)

  // Búsqueda por cédula del deudor solidario — si coincide con un cliente ya
  // registrado en el tenant, autocompleta nombre/teléfono (sin bloquear, se
  // pueden corregir) y guarda el clienteId para vincularlo.
  useEffect(() => {
    const cedula = deudorSolidario.cedula.trim()
    if (!tieneDeudorSolidario || cedula.length < 5) { setBuscandoCedula(false); return }

    setBuscandoCedula(true)
    let vigente = true
    const idTimeout = setTimeout(async () => {
      const params = new URLSearchParams({ busqueda: cedula, porPagina: '1' })
      const { ok, datos } = await apiFetch(`/api/tenant/clientes?${params}`)
      if (!vigente) return
      setBuscandoCedula(false)
      const encontrado = ok && (datos.clientes || []).find(c => c.cedula === cedula)
      if (encontrado) {
        onCambiarDeudorSolidario('clienteId', encontrado.id)
        onCambiarDeudorSolidario('nombreCompleto', encontrado.nombreCompleto)
        onCambiarDeudorSolidario('telefono', encontrado.telefono)
      } else if (deudorSolidario.clienteId) {
        onCambiarDeudorSolidario('clienteId', null)
      }
    }, 400)

    return () => { vigente = false; clearTimeout(idTimeout) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deudorSolidario.cedula, tieneDeudorSolidario])

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface-lowest border border-outline-variant/50 rounded-2xl shadow-card p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="w-8 h-8 rounded-lg bg-tertiary-container/25 text-on-tertiary-container flex items-center justify-center shrink-0">
            <IcoEscudo />
          </span>
          <p className="text-[14px] font-bold text-on-background m-0">Información de la garantía</p>
        </div>
        <p className="text-[12px] text-on-surface-variant mb-4">Registra la garantía del préstamo.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <CampoSelect
            etiqueta="Tipo de garantía *"
            placeholder="Selecciona el tipo de garantía"
            valor={garantia.tipo}
            onChange={v => onCambiarGarantia('tipo', v)}
            opciones={TIPOS_GARANTIA}
          />
          <CampoMoneda
            etiqueta="Valor estimado (opcional)"
            valor={garantia.valorEstimado}
            onChange={v => onCambiarGarantia('valorEstimado', v)}
          />
        </div>

        <div className="mb-4">
          <CampoTextarea
            etiqueta="Descripción de la garantía *"
            placeholder="Describe la garantía ofrecida"
            valor={garantia.descripcion}
            onChange={v => onCambiarGarantia('descripcion', v)}
            filas={3}
          />
          <p className="text-[11px] text-on-surface-variant mt-1">Incluye características, marca, modelo, placas, ubicación, etc.</p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant mb-2">Adjuntos (fotos o documentos)</p>
          <SelectorDocumentos documentos={documentos} onCambiar={onCambiarDocumentos} />
        </div>
      </div>

      <div className="bg-surface-lowest border border-outline-variant/50 rounded-2xl shadow-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
          <p className="text-[14px] font-bold text-on-background m-0">Deudor solidario</p>
          <Interruptor etiqueta="¿Tiene deudor solidario?" activo={tieneDeudorSolidario} onChange={onCambiarTieneDeudorSolidario} />
        </div>

        {tieneDeudorSolidario && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <CampoTexto
                etiqueta="Cédula"
                icono={<IcoBuscarChico />}
                placeholder="Busca por cédula"
                valor={deudorSolidario.cedula}
                onChange={v => onCambiarDeudorSolidario('cedula', v)}
              />
              {buscandoCedula && <p className="text-[11px] text-on-surface-variant mt-1">Buscando...</p>}
            </div>
            <CampoTexto
              etiqueta="Nombre completo *"
              placeholder="Nombre completo del deudor"
              valor={deudorSolidario.nombreCompleto}
              onChange={v => onCambiarDeudorSolidario('nombreCompleto', v)}
              requerido
            />
            <CampoTexto
              etiqueta="Teléfono *"
              tipo="tel"
              placeholder="Ej: 300 123 4567"
              valor={deudorSolidario.telefono}
              onChange={v => onCambiarDeudorSolidario('telefono', v)}
              requerido
            />
            <CampoSelect
              etiqueta="Relación *"
              placeholder="Selecciona la relación"
              valor={deudorSolidario.relacionConDeudor}
              onChange={v => onCambiarDeudorSolidario('relacionConDeudor', v)}
              opciones={RELACIONES}
            />
            <p className="text-[11px] text-on-surface-variant -mt-2 sm:col-span-2">Relación del deudor solidario con el cliente.</p>

            <div className="sm:col-span-2">
              <Interruptor
                etiqueta="¿Firmó documento?"
                activo={deudorSolidario.firmoDocumento}
                onChange={v => onCambiarDeudorSolidario('firmoDocumento', v)}
              />
              <p className="text-[11px] text-on-surface-variant mt-1">Indica si el deudor solidario firmó el documento.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
