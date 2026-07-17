import { formatearPrecio, formatearFechaLocal } from '../../../lib/formato'

function Fila({ etiqueta, valor, valorClases = 'text-on-background' }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[12.5px] text-on-surface-variant">{etiqueta}</span>
      <span className={`text-[13px] font-bold ${valorClases}`}>{valor}</span>
    </div>
  )
}

// Sidebar "Resumen del crédito" del wizard de préstamos — mismo cálculo exacto
// que el backend (GET/POST /simular usa calculoCredito.js), nunca recalculado
// en el frontend con floats de JS (CLAUDE.md §4). Se reutiliza en los pasos 1-4.
//
// Créditos de solo intereses (numeroCuotas = 0, resumen.esSoloIntereses):
// no hay cuota final ni fecha de vencimiento — se muestra el valor del
// interés a cobrar cada período y cada cuántos días se cobra, en vez de
// "Valor cuota"/"Total a pagar"/"Fecha vencimiento".
export default function ResumenCreditoCard({ resumen, caja, montoInicial }) {
  const tieneResumen = resumen && (resumen.valorCuota != null || resumen.valorPeriodico != null)

  return (
    <div className="rounded-2xl bg-surface-lowest border border-outline-variant/50 shadow-card p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <img src="/iconos/resumen.webp" alt="" className="w-9 h-9 shrink-0 select-none pointer-events-none" />
        <p className="text-[14px] font-bold text-on-background m-0">Resumen del crédito</p>
      </div>

      {!tieneResumen ? (
        <div className="text-center py-4">
          <img
            src="/iconos/resumen.webp"
            alt=""
            className="w-24 h-24 mx-auto mb-3 select-none pointer-events-none opacity-90"
          />
          <p className="text-[12.5px] text-on-surface-variant leading-relaxed">
            A medida que completes la información, verás el resumen del préstamo aquí.
          </p>
        </div>
      ) : resumen.esSoloIntereses ? (
        <>
          <div className="rounded-lg bg-secondary-container/15 text-on-secondary-container text-[11.5px] font-semibold px-3 py-2 mb-3 flex items-center gap-1.5">
            <span aria-hidden="true">↻</span> Los valores se actualizan automáticamente con cada cambio
          </div>
          <div className="rounded-lg bg-on-tertiary-container/10 text-on-tertiary-container text-[11.5px] font-semibold px-3 py-2 mb-3">
            Solo intereses — sin plazo fijo. El capital se paga aparte cuando el cliente decida.
          </div>
          <div className="flex flex-col divide-y divide-outline-variant/30">
            <Fila etiqueta="Valor del interés a cobrar" valor={formatearPrecio(resumen.valorPeriodico)} />
            <Fila etiqueta="Días que se debe cobrar" valor={resumen.diasCobro ? `Cada ${resumen.diasCobro} día${resumen.diasCobro !== 1 ? 's' : ''}` : '—'} />
          </div>
        </>
      ) : (
        <>
          <div className="rounded-lg bg-secondary-container/15 text-on-secondary-container text-[11.5px] font-semibold px-3 py-2 mb-3 flex items-center gap-1.5">
            <span aria-hidden="true">↻</span> Los valores se actualizan automáticamente con cada cambio
          </div>

          <div className="flex flex-col divide-y divide-outline-variant/30">
            <Fila etiqueta="Valor cuota" valor={formatearPrecio(resumen.valorCuota)} />
            <Fila etiqueta="Total a pagar" valor={formatearPrecio(resumen.totalAPagar)} />
            <Fila etiqueta="Total intereses" valor={formatearPrecio(resumen.totalIntereses)} />
            <Fila etiqueta="Fecha vencimiento" valor={formatearFechaLocal(resumen.fechaVencimiento)} />
          </div>
        </>
      )}

      {caja && (
        <div className="mt-4 pt-4 border-t border-outline-variant/40">
          <p className="text-[12.5px] font-semibold text-on-background mb-1">{caja.nombre}</p>
          <Fila etiqueta="Disponible" valor={formatearPrecio(caja.disponible)} />
          {montoInicial > 0 && (
            <Fila
              etiqueta="Después del préstamo"
              valor={formatearPrecio(Math.max(0, Number(caja.disponible) - Number(montoInicial)))}
              valorClases={Number(caja.disponible) - Number(montoInicial) < 0 ? 'text-error' : 'text-secondary'}
            />
          )}
        </div>
      )}
    </div>
  )
}
