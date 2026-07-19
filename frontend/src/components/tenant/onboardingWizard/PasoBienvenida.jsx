import { IcoEdificio, IcoPersonas, IcoReloj, IcoMas } from '../iconos'

function IcoFlecha({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

// Fila de característica ("Capital para prestar dinero" / "Tu primer
// cobrador") — círculo de ícono con color propio (no tokens del sistema:
// el mockup usa un verde menta y un morado que no existen en la paleta de
// CLAUDE.md) + insignia "+" opcional en la esquina, fiel al mockup de
// referencia (2026-07-19).
function FilaCaracteristica({ icono, colorFondo, colorIcono, insignia, titulo, descripcion }) {
  return (
    <div className="flex items-start gap-4">
      <span
        className="relative w-12 h-12 rounded-full flex items-center justify-center shrink-0"
        style={{ background: colorFondo }}
      >
        <span style={{ color: colorIcono, display: 'flex' }}>{icono}</span>
        {insignia && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white"
            style={{ background: '#22c55e', border: '2px solid #ffffff' }}
          >
            <IcoMas size={10} />
          </span>
        )}
      </span>
      <div>
        <p className="text-[15px] font-bold m-0" style={{ color: '#0b1c30' }}>{titulo}</p>
        <p className="text-[13px] m-0 mt-0.5" style={{ color: '#64748b' }}>{descripcion}</p>
      </div>
    </div>
  )
}

// Pantalla de bienvenida del wizard de configuración inicial — no arma ningún
// dato todavía, solo explica qué viene y deja avanzar. Colores en hex directo
// (no clases del sistema de diseño) a propósito: reproduce el mockup de
// referencia al pixel, incluyendo tonos (verde de botón, morado del ícono de
// cobrador) que no forman parte de la paleta de CLAUDE.md.
export default function PasoBienvenida({ onComenzar }) {
  return (
    <div
      className="relative rounded-2xl bg-white p-8 sm:p-10 overflow-hidden"
      style={{ boxShadow: '0 2px 12px rgba(0,40,85,0.06), 0 8px 24px rgba(0,40,85,0.06)' }}
    >
      <img
        src="/iconos/operador.webp"
        alt=""
        className="hidden md:block absolute top-2 right-2 h-auto select-none pointer-events-none"
        style={{ width: 'clamp(180px, 18vw, 260px)' }}
      />

      <div className="max-w-[420px]">
        <h1 className="text-[28px] font-bold m-0 mb-4 tracking-tight leading-tight" style={{ color: '#0b1c30' }}>
          ¡Bienvenido a <span style={{ color: '#16a34a' }}>GotaPay</span>!
        </h1>
        <p className="text-[15px] leading-relaxed mb-7" style={{ color: '#5b6474' }}>
          Tu espacio ya está listo. Solo necesitamos configurar dos elementos para que puedas comenzar a registrar préstamos.
        </p>

        <div className="flex flex-col gap-5 mb-7">
          <FilaCaracteristica
            icono={<IcoEdificio size={22} />}
            colorFondo="#d9f7e6"
            colorIcono="#16a34a"
            titulo="Capital para prestar dinero"
            descripcion="Define el dinero disponible para tus préstamos."
          />
          <FilaCaracteristica
            icono={<IcoPersonas size={22} />}
            colorFondo="#e7e0fb"
            colorIcono="#7c4fe0"
            insignia
            titulo="Tu primer cobrador"
            descripcion="Agrega a la persona que registrará los cobros."
          />
        </div>

        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold mb-7"
          style={{ background: '#e3f9ec', color: '#16a34a' }}
        >
          <IcoReloj size={14} /> Tiempo estimado: menos de 2 minutos
        </div>

        <div>
          <button
            type="button"
            onClick={onComenzar}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[14.5px] font-bold text-white border-none cursor-pointer transition-transform hover:scale-[1.02]"
            style={{ background: '#16a34a' }}
          >
            Comenzar configuración <IcoFlecha />
          </button>
        </div>
      </div>
    </div>
  )
}
