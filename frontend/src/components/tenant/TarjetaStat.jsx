import BarraProgreso from './BarraProgreso'

// Tarjeta de estadística DRY — usada por el Dashboard general y por los paneles
// de colaborador (ej. panel del cobrador). Ilustración 3D a la derecha, valor
// principal, delta opcional vs período anterior, y footer de "ver detalle" o
// barra de uso de plan.
//
// `compacto` — para columnas angostas (ej. dos tarjetas lado a lado en una columna
// de 35%, como en Capital y Socios): ícono chico anclado arriba a la derecha (no
// centrado verticalmente), para que nunca tape el valor principal ni le quite
// protagonismo al dato.
export default function TarjetaStat({ titulo, subtitulo, valor, imagen3d, badge, delta, notaInferior, href, peligro, planUso, compacto = false, centrarValor = false }) {
  return (
    <div className={`relative bg-surface-lowest border border-outline-variant/50 rounded-2xl overflow-hidden flex flex-col shadow-card ${compacto ? 'min-h-[140px]' : 'min-h-[178px]'}`}>

      {/* Ilustración 3D — compacta: esquina superior derecha; normal: derecha centrada */}
      <img
        src={imagen3d}
        alt=""
        className={
          compacto
            ? 'absolute top-3 right-3 w-11 h-11 sm:w-12 sm:h-12 object-contain pointer-events-none select-none'
            : 'absolute top-1/2 -translate-y-1/2 right-3 w-[107px] h-[107px] sm:w-[125px] sm:h-[125px] object-contain pointer-events-none select-none'
        }
      />

      {/* Contenido principal */}
      <div className={`flex-1 p-5 ${compacto ? '' : 'pr-[123px] sm:pr-[141px]'}`}>

        {/* Badge (opcional) + título — reserva espacio para el ícono solo en esta fila */}
        <div className={`flex items-center gap-2 mb-0.5 ${compacto ? 'pr-12 sm:pr-14' : ''}`}>
          {badge && (
            <span className={`w-[26px] h-[26px] rounded-[7px] flex items-center justify-center shrink-0 ${badge.clases}`}>
              {badge.icono}
            </span>
          )}
          <span className="text-on-surface-variant text-[13px] font-semibold leading-tight line-clamp-1">
            {titulo}
          </span>
        </div>
        <p className={`text-[11px] text-on-surface-variant mb-4 ${badge ? 'pl-[34px]' : ''} ${compacto ? 'pr-12 sm:pr-14' : ''}`}>{subtitulo}</p>

        {/* Valor principal — a todo el ancho, sin reservar espacio para el ícono.
            `centrarValor` lo centra horizontalmente (ej. conteos de una sola cifra,
            donde el número es el foco visual de la tarjeta, no un monto largo). */}
        <p className={`font-bold tracking-tight leading-none mb-2 ${centrarValor ? 'text-center' : ''} ${
          peligro
            ? 'text-[38px] sm:text-[44px] text-error animate-[brillo-rojo_2s_ease-in-out_infinite]'
            : 'text-[30px] sm:text-[33px] text-on-background'
        }`}>
          {valor}
        </p>

        {/* Delta — `sufijo` por defecto '%'; pasar '' para deltas de conteo simple */}
        {delta && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[12px] font-bold ${delta.positivo ? 'text-secondary' : 'text-error'}`}>
              {delta.sube ? '↑' : '↓'} {delta.porcentaje}{delta.sufijo ?? '%'}
            </span>
            <span className="text-[11px] text-on-surface-variant">{delta.texto}</span>
          </div>
        )}

        {/* Nota inferior — monto destacado en vez de delta (ej. "$1.245.800") */}
        {notaInferior && (
          <p className={`text-[13px] font-bold m-0 ${notaInferior.clase}`}>{notaInferior.texto}</p>
        )}
      </div>

      {/* Footer — Ver detalle */}
      {href && (
        <a
          href={href}
          className="flex items-center justify-between px-5 py-3 border-t border-outline-variant/50 text-[12px] text-on-surface-variant hover:text-on-tertiary-container hover:bg-surface-low transition-all duration-150 shrink-0"
        >
          Ver detalle
          <span className="text-sm">→</span>
        </a>
      )}

      {/* Footer — Uso del plan */}
      {planUso && (
        <div className="px-5 py-3 border-t border-outline-variant/50 shrink-0">
          <BarraProgreso usados={planUso.usados} limite={planUso.limite} />
        </div>
      )}
    </div>
  )
}
