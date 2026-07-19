import useTamanoPantalla from '../hooks/useTamanoPantalla'
import { IcoCheck } from '../components/tenant/iconos'

const PASOS = [
  { numero: 1, etiqueta: 'Capital', descripcion: 'Crea tu capital' },
  { numero: 2, etiqueta: 'Cobrador', descripcion: 'Agrega tu primer cobrador' },
  { numero: 3, etiqueta: '¡Listo!', descripcion: 'Comienza a usar GotaPay' },
]

// Gris real (no blanco con opacidad reducida) — se ve limpio sobre el navy en
// cualquier pantalla, a diferencia de text-white/40 que puede leerse lavado.
const GRIS_TENUE = '#a9b2c3'
const GRIS_MEDIO = '#c7cedb'

function BarraAyuda() {
  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <p className="text-[13px] font-bold text-white m-0 mb-1">¿Necesitas ayuda?</p>
      <p className="text-[11.5px] m-0 mb-2 leading-relaxed" style={{ color: GRIS_TENUE }}>Estamos para apoyarte.</p>
      <a href="mailto:soporte@gotapay.net" className="text-[11.5px] font-semibold no-underline" style={{ color: '#56fbab' }}>
        soporte@gotapay.net
      </a>
    </div>
  )
}

// Shell del wizard de configuración inicial obligatorio — tarjeta flotante
// (navy + blanco, esquinas redondeadas y sombra) centrada sobre el fondo
// claro de la app, igual que el mockup de referencia. Reemplaza por completo
// el chrome normal del panel (SidebarTenant/TopbarTenant) mientras el tenant
// no haya terminado — ver DashboardTenant.jsx.
//
// En móvil NO se usa la tarjeta flotante (desperdiciaría espacio en una
// pantalla ya chica) — se usa una barra compacta con el paso actual y una
// barra de progreso, mismo criterio de useTamanoPantalla() que ya usa
// DashboardTenant.jsx para su propio sidebar/topbar.
export default function OnboardingLayout({ paso, children }) {
  const esMobil = useTamanoPantalla()

  if (esMobil) {
    const pasoActual = PASOS[paso - 1]
    const porcentaje = Math.round((paso / PASOS.length) * 100)
    return (
      <div className="min-h-svh flex flex-col bg-background" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
        <div className="px-5 pt-5 pb-4" style={{ background: 'linear-gradient(135deg, #001430 0%, #002055 100%)' }}>
          <img src="/logotipo_sin slogan.webp" alt="GotaPay" style={{ height: 26, width: 'auto', mixBlendMode: 'screen' }} className="mb-4" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold text-white">{pasoActual?.etiqueta}</span>
            <span className="text-[11px]" style={{ color: GRIS_TENUE }}>Paso {paso} de {PASOS.length}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
            <div className="h-full rounded-full bg-secondary transition-all duration-300" style={{ width: `${porcentaje}%` }} />
          </div>
        </div>
        <div className="flex-1 px-5 py-6">{children}</div>
      </div>
    )
  }

  // Centrado en alto y ancho — sin minHeight forzado en la tarjeta (crece
  // según su contenido real), y con overflow-y-auto acá afuera: si algún paso
  // llegara a ser más alto que el viewport, la página se desplaza normal en
  // vez de cortar la tarjeta arriba y abajo (el bug original era la
  // combinación de centrado + una altura mínima fija que no tenía que ver con
  // el contenido real).
  return (
    <div
      className="min-h-svh flex items-center justify-center bg-background py-6 px-6 lg:py-10 lg:px-10 overflow-y-auto"
      style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}
    >
      <div
        className="w-full max-w-[1180px] mx-auto rounded-[28px] overflow-hidden flex"
        style={{ boxShadow: '0 24px 60px -12px rgba(0,20,48,0.22), 0 4px 16px rgba(0,20,48,0.10)' }}
      >
        <aside
          className="w-[300px] shrink-0 flex flex-col justify-between gap-8 p-8"
          style={{ background: 'linear-gradient(180deg, #001430 0%, #002055 100%)' }}
        >
          <div>
            <img src="/logotipo_sin slogan.webp" alt="GotaPay" style={{ height: 36, width: 'auto', mixBlendMode: 'screen' }} className="mb-10" />

            <div className="flex flex-col gap-1">
              {PASOS.map((p, i) => {
                const completado = p.numero < paso
                const activo = p.numero === paso
                return (
                  <div key={p.numero} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 transition-colors"
                        style={
                          completado ? { background: '#56fbab', color: '#001430' }
                          : activo ? { background: '#56fbab', color: '#001430' }
                          : { background: 'rgba(255,255,255,0.08)', color: GRIS_MEDIO, border: '1px solid rgba(255,255,255,0.18)' }
                        }
                      >
                        {completado ? <IcoCheck size={14} /> : p.numero}
                      </span>
                      {i < PASOS.length - 1 && (
                        <div className="w-px flex-1 my-0.5" style={{ minHeight: 26, background: completado ? '#56fbab' : 'rgba(255,255,255,0.15)' }} />
                      )}
                    </div>
                    <div className="pb-6 pt-1">
                      <p className="text-[13.5px] font-bold m-0" style={{ color: activo || completado ? '#ffffff' : GRIS_MEDIO }}>{p.etiqueta}</p>
                      <p className="text-[11.5px] m-0 mt-0.5" style={{ color: GRIS_TENUE }}>{p.descripcion}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <BarraAyuda />
        </aside>

        <main className="flex-1 bg-white">
          <div className="max-w-[900px] mx-auto px-8 py-12 xl:px-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
