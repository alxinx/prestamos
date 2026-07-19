import { IcoEditar, IcoMoneda, IcoPersonas, IcoArchivo } from '../iconos'
import { formatearPrecio, formatearFechaLocal } from '../../../lib/formato'
import { ETIQUETA_FRECUENCIA_PAGO } from '../../../lib/plantillaCreditoFormato'
import { ETIQUETA_TIPO_GARANTIA } from '../../../lib/prestamoWizardConstantes'
import { ETIQUETA_RELACION } from '../../../lib/clienteWizardConstantes'
import { formatearTamanoArchivo } from '../../../lib/documentos'

function IcoEscudo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  )
}

function BotonEditar({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant text-[12px] font-semibold cursor-pointer hover:bg-surface-default transition-colors shrink-0"
    >
      <IcoEditar size={13} /> Editar
    </button>
  )
}

function Bloque({ icono, iconoClases, titulo, onEditar, children }) {
  return (
    <div className="py-4 border-b border-outline-variant/40 last:border-0">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconoClases}`}>{icono}</span>
          <p className="text-[13.5px] font-bold text-on-background m-0">{titulo}</p>
        </div>
        <BotonEditar onClick={onEditar} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pl-[42px]">{children}</div>
    </div>
  )
}

function Dato({ etiqueta, valor }) {
  return (
    <div>
      <p className="text-[12.5px] text-on-surface-variant m-0">{etiqueta}</p>
      <p className="text-[15px] font-semibold text-on-background m-0">{valor ?? '—'}</p>
    </div>
  )
}

// Paso 4 — a diferencia del mockup (un solo botón "Editar información" arriba
// de todo el bloque), cada sección lleva su propio botón "Editar" que salta
// directo a ese paso — decisión 2026-07-16, más preciso que un editar general.
export default function Paso4ResumenConfirmacion({
  plantillaNombre, detalles, resumen, redondearCuotaMil, cliente, cobrador, caja, garantia, documentos,
  tieneDeudorSolidario, deudorSolidario, onEditar,
}) {
  const esSoloIntereses = Number(detalles.numeroCuotas) === 0

  return (
    <div className="bg-surface-lowest border border-outline-variant/50 rounded-2xl shadow-card p-5 sm:p-6">
      <p className="text-[15px] font-bold text-on-background m-0">4. Resumen del préstamo</p>
      <p className="text-[12.5px] text-on-surface-variant mt-1 mb-2">Verifica que todos los datos estén correctos antes de guardar el préstamo.</p>

      <Bloque icono={<IcoMoneda size={16} />} iconoClases="bg-secondary-container/25 text-secondary" titulo="Detalles del préstamo" onEditar={() => onEditar(1)}>
        <Dato etiqueta="Plantilla de crédito" valor={plantillaNombre || 'Sin plantilla / Personalizado'} />
        <Dato etiqueta="Número de cuotas" valor={esSoloIntereses ? 'Solo intereses (sin plazo fijo)' : detalles.numeroCuotas} />
        <Dato etiqueta="Monto del préstamo" valor={formatearPrecio(detalles.montoInicial || 0)} />
        <Dato etiqueta="Frecuencia de pago" valor={ETIQUETA_FRECUENCIA_PAGO[detalles.frecuenciaPago]} />
        <Dato etiqueta="Tasa de interés" valor={`${detalles.tasaInteres || 0}%`} />
        <Dato etiqueta="Fecha de inicio" valor={formatearFechaLocal(detalles.fechaInicio)} />
        <Dato etiqueta="Fecha de la letra" valor={detalles.fechaLetra ? formatearFechaLocal(detalles.fechaLetra) : 'Sin definir'} />
        <Dato etiqueta="Redondear cuota a múltiplo de 1.000" valor={redondearCuotaMil ? 'Sí' : 'No'} />
        {esSoloIntereses && resumen && (
          <>
            <Dato etiqueta="Valor del interés a cobrar" valor={resumen.valorPeriodico != null ? formatearPrecio(resumen.valorPeriodico) : '—'} />
            <Dato etiqueta="Días que se debe cobrar" valor={resumen.diasCobro ? `Cada ${resumen.diasCobro} día${resumen.diasCobro !== 1 ? 's' : ''}` : '—'} />
          </>
        )}
      </Bloque>

      <Bloque icono={<IcoPersonas size={16} />} iconoClases="bg-primary/10 text-primary" titulo="Cliente, cobrador y caja" onEditar={() => onEditar(2)}>
        <Dato etiqueta="Cliente" valor={cliente?.nombreCompleto} />
        <Dato etiqueta="Cobrador responsable" valor={cobrador?.nombreCompleto} />
        <Dato etiqueta="Cédula" valor={cliente?.cedula} />
        <Dato etiqueta="Caja de capital" valor={caja?.nombre} />
        <Dato etiqueta="Teléfono" valor={cliente?.telefono} />
        <Dato etiqueta="Saldo disponible" valor={caja ? formatearPrecio(caja.disponible) : null} />
      </Bloque>

      <Bloque icono={<IcoEscudo />} iconoClases="bg-tertiary-container/25 text-on-tertiary-container" titulo="Garantía" onEditar={() => onEditar(3)}>
        <Dato etiqueta="Tipo de garantía" valor={ETIQUETA_TIPO_GARANTIA[garantia.tipo]} />
        <Dato etiqueta="Valor estimado" valor={garantia.valorEstimado > 0 ? formatearPrecio(garantia.valorEstimado) : 'Sin definir'} />
        <div className="sm:col-span-2">
          <p className="text-[12.5px] text-on-surface-variant m-0">Descripción</p>
          <p className="text-[15px] font-semibold text-on-background m-0">{garantia.descripcion || '—'}</p>
        </div>
        {documentos.length > 0 && (
          <div className="sm:col-span-2">
            <p className="text-[11px] text-on-surface-variant mb-1.5">Adjuntos ({documentos.length})</p>
            <ul className="flex flex-col gap-1">
              {documentos.map(d => (
                <li key={d.id} className="flex items-center gap-1.5 text-[12px] text-on-background">
                  <IcoArchivo size={13} /> {d.nombre} <span className="text-on-surface-variant">({formatearTamanoArchivo(d.archivo.size)})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Bloque>

      {tieneDeudorSolidario && (
        <Bloque icono={<IcoPersonas size={16} />} iconoClases="bg-error-container text-on-error-container" titulo="Deudor solidario" onEditar={() => onEditar(3)}>
          <Dato etiqueta="Cédula" valor={deudorSolidario.cedula} />
          <Dato etiqueta="Relación" valor={ETIQUETA_RELACION[deudorSolidario.relacionConDeudor]} />
          <Dato etiqueta="Nombre" valor={deudorSolidario.nombreCompleto} />
          <Dato etiqueta="¿Firmó documento?" valor={deudorSolidario.firmoDocumento ? 'Sí' : 'No'} />
          <Dato etiqueta="Teléfono" valor={deudorSolidario.telefono} />
        </Bloque>
      )}
    </div>
  )
}
