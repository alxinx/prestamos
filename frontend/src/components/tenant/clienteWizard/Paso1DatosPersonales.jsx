import CampoTexto from '../CampoTexto'
import CampoFecha from '../CampoFecha'
import { IcoCheck, IcoInfo } from '../iconos'

function IcoBuscar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IcoAlerta() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" /><path d="M12 17h.01" />
    </svg>
  )
}

// Paso 1 — busca la cédula contra ClienteGlobal (tabla deliberadamente sin
// tenantId, ver clientes.service.js) y resuelve uno de tres estados: cliente
// nuevo (nada encontrado), cliente global reutilizable (existe pero no en este
// tenant — sus datos personales quedan de solo lectura, nunca editables desde
// acá), o cliente ya registrado en este tenant (bloquea continuar). La búsqueda
// es automática (debounced en NuevoCliente.jsx apenas se deja de escribir) — no
// depende de ningún clic.
export default function Paso1DatosPersonales({
  cedula, onCambiarCedula, buscando, error,
  resultado, datosPersonales, onCambiarDatosPersonales,
}) {
  const soloLectura = !!resultado?.existeGlobal
  const bloqueado = !!resultado?.existeEnTenant

  return (
    <div className="bg-surface-lowest rounded-2xl border border-outline-variant/50 shadow-card p-5 sm:p-6">
      <div className="flex items-center gap-1.5 mb-1">
        <h2 className="text-[15px] font-bold text-on-background m-0">Datos personales — ClienteGlobal</h2>
        <span className="text-on-surface-variant/50"><IcoInfo /></span>
      </div>
      <p className="text-[13px] text-on-surface-variant mb-5">Busca por cédula para validar si el cliente ya existe en la base global.</p>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
        <div>
          <label className="block text-[12px] font-semibold text-on-surface-variant mb-1.5">
            Cédula <span className="text-error">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={cedula}
              onChange={e => onCambiarCedula(e.target.value)}
              placeholder="Ej. 1023456789"
              className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-outline-variant text-[14px] text-on-background bg-surface-lowest outline-none focus:border-2 focus:border-primary transition-colors"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
              {buscando
                ? <span className="block w-4 h-4 rounded-full border-2 border-outline-variant border-t-primary animate-spin" />
                : <IcoBuscar />}
            </span>
          </div>
          {buscando && <p className="text-[12px] text-on-surface-variant mt-1.5">Buscando...</p>}
          {error && <p className="text-[12px] text-error mt-1.5">{error}</p>}

          {bloqueado && (
            <div className="mt-4 rounded-xl bg-error-container p-4">
              <p className="text-[13px] font-bold text-on-error-container m-0 mb-1">Este cliente ya existe en tu organización</p>
              <p className="text-[12.5px] text-on-error-container/90 m-0">
                Ya hay un registro con esta cédula en tu tenant. Si necesitas corregir algún dato, hazlo desde el
                listado de clientes en vez de crear uno nuevo.
              </p>
            </div>
          )}

          {!bloqueado && (
            <>
              {soloLectura && (
                <span className="inline-block mt-4 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-on-tertiary-container/12 text-on-tertiary-container">
                  Cliente Global
                </span>
              )}
              <p className={`text-[11.5px] text-on-surface-variant ${soloLectura ? 'mt-1.5' : 'mt-4'} mb-4`}>
                {soloLectura
                  ? 'Los datos principales se gestionan desde la base global y no pueden editarse aquí.'
                  : 'Si la cédula no existe todavía, completa los datos para registrar un cliente nuevo.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CampoTexto
                  etiqueta="Nombre completo *"
                  valor={datosPersonales.nombreCompleto}
                  onChange={v => onCambiarDatosPersonales('nombreCompleto', v)}
                  placeholder="Ej. Alejandro González"
                  disabled={soloLectura}
                />
                <CampoTexto
                  etiqueta="Teléfono *"
                  valor={datosPersonales.telefono}
                  onChange={v => onCambiarDatosPersonales('telefono', v)}
                  placeholder="Ej. 300 123 4567"
                  disabled={soloLectura}
                />
                <CampoTexto
                  etiqueta="Email (opcional)"
                  tipo="email"
                  valor={datosPersonales.email}
                  onChange={v => onCambiarDatosPersonales('email', v)}
                  placeholder="Ej. cliente@correo.com"
                  disabled={soloLectura}
                />
              </div>
              <div className="mt-4 max-w-[260px]">
                <CampoFecha
                  etiqueta="Fecha de nacimiento"
                  valor={datosPersonales.fechaNacimiento}
                  onChange={v => onCambiarDatosPersonales('fechaNacimiento', v)}
                  disabled={soloLectura}
                />
              </div>

              {soloLectura && (
                <div className="mt-5 flex items-start gap-3 rounded-xl bg-on-tertiary-container/8 p-4">
                  <span className="text-on-tertiary-container shrink-0 mt-0.5"><IcoInfo size={16} /></span>
                  <p className="text-[12.5px] text-on-tertiary-container m-0 leading-relaxed">
                    Estos datos provienen del registro global del cliente. Para editarlos, debes hacerlo desde la
                    administración global.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {!soloLectura && (
          <div className="flex items-center justify-center py-6">
            <img
              src="/iconos/users.webp"
              alt=""
              className="w-full max-w-[200px] select-none pointer-events-none"
            />
          </div>
        )}

        {resultado && !bloqueado && soloLectura && (
          <div className="rounded-xl bg-secondary-container/15 border border-secondary/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-on-primary shrink-0">
                <IcoCheck size={14} />
              </span>
              <p className="text-[13.5px] font-bold text-on-background m-0">Cliente encontrado</p>
            </div>
            <p className="text-[12.5px] text-on-surface-variant m-0 mb-3">Este cliente ya existe en la base global.</p>

            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wide mb-0.5">Nombre completo</p>
            <p className="text-[13.5px] font-semibold text-on-background mb-2.5">{datosPersonales.nombreCompleto}</p>

            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wide mb-0.5">Teléfono</p>
            <p className="text-[13.5px] font-semibold text-on-background mb-3">{datosPersonales.telefono}</p>

            <p className="text-[11.5px] text-on-surface-variant m-0">Este registro será reutilizado en todos los tenants.</p>
          </div>
        )}

        {resultado && bloqueado && (
          <div className="rounded-xl bg-error-container/60 border border-error/20 p-4 flex items-start gap-3">
            <span className="text-error shrink-0 mt-0.5"><IcoAlerta /></span>
            <p className="text-[12.5px] text-on-error-container m-0 leading-relaxed">
              Ve al listado de clientes y búscalo por cédula para revisar o corregir su información.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
