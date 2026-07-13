import Casilla from '../Casilla'
import CampoArchivo from '../CampoArchivo'
import { IcoInfo, IcoCandado } from '../iconos'

const ACEPTAR_ARCHIVOS = '.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'

function FilaConsentimiento({ titulo, descripcion, marcado, onChange, obligatorio }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-outline-variant/40 last:border-b-0">
      <div className="pt-0.5">
        <Casilla marcado={marcado} onChange={onChange} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-on-background m-0">
          {titulo} {obligatorio && <span className="text-error">*</span>}
        </p>
        <p className="text-[12px] text-on-surface-variant mt-0.5 m-0 leading-relaxed">{descripcion}</p>
      </div>
      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${
        obligatorio ? 'bg-secondary-container/25 text-on-secondary-container' : 'bg-outline-variant/30 text-on-surface-variant'
      }`}>
        {obligatorio ? 'Obligatorio' : 'Opcional'}
      </span>
    </div>
  )
}

// Paso 5 — último paso: consentimientos (cuelgan de ClienteGlobal, no del Cliente
// del tenant, ver clientes.service.js) + documentos opcionales. Solo JPG, PDF y
// Office — cualquier JPG se convierte a WEBP en el backend (nunca en el
// navegador: la conversión real y la validación de firma binaria viven en
// lib/documentos.js, esto es solo el filtro de UX).
export default function Paso5Consentimientos({ consentimientos, onCambiarConsentimiento, documentos, onCambiarDocumentos }) {
  return (
    <div className="bg-surface-lowest rounded-2xl border border-outline-variant/50 shadow-card p-5 sm:p-6">
      <div className="flex items-center gap-1.5 mb-1">
        <h2 className="text-[15px] font-bold text-on-background m-0">Consentimientos — ClienteGlobal</h2>
        <span className="text-on-surface-variant/50"><IcoInfo /></span>
      </div>
      <p className="text-[13px] text-on-surface-variant mb-4">Estos consentimientos aplican al cliente en toda la plataforma GotaPay.</p>

      <div className="max-w-[640px]">
        <FilaConsentimiento
          titulo="Autoriza el tratamiento de sus datos personales"
          descripcion="Autorizo de manera libre, previa, expresa e informada el tratamiento de mis datos personales conforme a la Política de Tratamiento de Datos de GotaPay."
          marcado={consentimientos.tratamientoDatos}
          onChange={v => onCambiarConsentimiento('tratamientoDatos', v)}
          obligatorio
        />
        <FilaConsentimiento
          titulo="Autoriza compartir su score entre tenants"
          descripcion="Autorizo que mi score crediticio pueda ser consultado y compartido entre los diferentes tenants de la plataforma GotaPay para evaluación de crédito."
          marcado={consentimientos.compartirScore}
          onChange={v => onCambiarConsentimiento('compartirScore', v)}
        />
        <FilaConsentimiento
          titulo="Autoriza recibir notificaciones por WhatsApp"
          descripcion="Autorizo a GotaPay y a sus tenants a enviarme notificaciones, recordatorios y comunicaciones a través de WhatsApp."
          marcado={consentimientos.notificacionesWsp}
          onChange={v => onCambiarConsentimiento('notificacionesWsp', v)}
        />

        {!consentimientos.tratamientoDatos && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary-container/20 px-3.5 py-2.5">
            <span className="text-secondary shrink-0"><IcoCandado size={14} /></span>
            <p className="text-[12.5px] text-on-background m-0">Sin el consentimiento obligatorio no podrás crear el cliente.</p>
          </div>
        )}
      </div>

      <div className="mt-7 max-w-[640px]">
        <p className="text-[13.5px] font-bold text-on-background mb-1">Documentos del cliente (opcional)</p>
        <p className="text-[12px] text-on-surface-variant mb-3">Sube documentos que respalden la información del cliente. Puedes subir uno o varios archivos.</p>
        <CampoArchivo
          archivos={documentos}
          onCambiar={onCambiarDocumentos}
          aceptar={ACEPTAR_ARCHIVOS}
          multiple
          maxSizeMB={10}
          ayuda="Formatos permitidos: PDF, JPG, Word, Excel, PowerPoint · Tamaño máximo: 10 MB por archivo"
        />
      </div>
    </div>
  )
}
