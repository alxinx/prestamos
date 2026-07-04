/**
 * Shell de dos paneles para todas las páginas de autenticación del tenant:
 * Login, RecuperarContrasena, RestablecerContrasena.
 *
 * Props del panel izquierdo:
 *   indicador  — texto del badge verde superior (default "Red activa")
 *   titulo     — JSX o string del headline (puede incluir <span> con color)
 *   descripcion — párrafo de apoyo bajo el título
 *   pieIzq     — nota pequeña al fondo del panel izquierdo
 */
export default function TenantAuthLayout({ indicador, titulo, descripcion, pieIzq, children }) {
  return (
    <div
      className="min-h-svh flex flex-col"
      style={{ fontFamily: "'Hanken Grotesk', sans-serif", background: '#020d1a' }}
    >
      <div className="flex-1 grid lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_520px]">

        {/* ── Panel izquierdo ── */}
        <div
          className="relative hidden lg:flex flex-col justify-between p-12 xl:p-16 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #001430 0%, #002055 50%, #001a45 100%)' }}
        >
          {/* Grid decorativo */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'linear-gradient(rgba(86,251,171,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(86,251,171,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />
          {/* Glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(86,251,171,0.06) 0%, transparent 70%)' }} />

          {/* Logo */}
          <div className="relative">
            <img src="/logotipo_sin slogan.webp" alt="GotaPay" style={{ height: 56, width: 'auto', mixBlendMode: 'screen' }} />
          </div>

          {/* Contenido */}
          <div className="relative">
            <div className="flex items-center gap-2 mb-8">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#56fbab' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#56fbab', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {indicador ?? 'Red activa'}
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(32px, 3.5vw, 48px)', fontWeight: 700, color: '#ffffff', lineHeight: 1.12, letterSpacing: '-0.02em', marginBottom: 20 }}>
              {titulo}
            </h1>

            {descripcion && (
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: '0 0 40px', maxWidth: 380 }}>
                {descripcion}
              </p>
            )}

            {pieIzq && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24 }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0, lineHeight: 1.6 }}>{pieIzq}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Panel derecho ── */}
        <div
          className="flex flex-col justify-between min-h-svh lg:min-h-0"
          style={{ background: '#060f1e', borderLeft: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Logo mobile */}
          <div className="flex lg:hidden items-center px-6 py-5">
            <img src="/isotipo.webp" alt="GotaPay" style={{ height: 48, width: 'auto' }} />
          </div>

          {/* Contenido de la página */}
          <div className="flex-1 flex items-center justify-center px-6 py-10">
            <div className="w-full max-w-[380px]">
              {children}
            </div>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px' }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0, textAlign: 'center' }}>
              © {new Date().getFullYear()} GotaPay · Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px #0a1628 inset !important; -webkit-text-fill-color: #ffffff !important; }
      `}</style>
    </div>
  )
}
