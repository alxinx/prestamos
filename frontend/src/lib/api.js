// Prefijos de API conocidos — tenant y master-admin comparten este mismo
// apiFetch pero cada uno refresca contra su propio endpoint (ver
// crearAuthContext.jsx, que ya usa el mismo patrón `${prefijo}/refresh`).
const PREFIJOS_API = ['/api/tenant/', '/api/master-admin/']

function endpointRefreshPara(url) {
  const prefijo = PREFIJOS_API.find(p => url.startsWith(p))
  return prefijo ? `${prefijo}auth/refresh` : null
}

// Evita refrescos concurrentes duplicados si varias peticiones 401 llegan
// casi al mismo tiempo (ej. varias pestañas de un modal cargando datos en
// paralelo) — todas esperan la MISMA promesa de refresh en vez de disparar
// una por cada una.
let refrescoEnCurso = null

async function refrescarSesion(refreshUrl) {
  if (!refrescoEnCurso) {
    refrescoEnCurso = fetch(refreshUrl, { method: 'POST', credentials: 'include' })
      .then(res => res.ok)
      .catch(() => false)
      .finally(() => { refrescoEnCurso = null })
  }
  return refrescoEnCurso
}

// Helper DRY de fetch — centraliza `credentials: 'include'`, el JSON.stringify del body
// y el parseo de la respuesta, que antes se repetían a mano en cada página.
//
// Access token de corta duración (15 min, CLAUDE.md §6) sin ningún refresh
// proactivo en el frontend (crearAuthContext.jsx solo refresca una vez, al
// montar) — cualquier sesión activa por más de 15 minutos empezaba a recibir
// 401 en silencio en la siguiente acción, sin que el operador supiera que fue
// por expiración y no por un error real. Acá se reintenta UNA vez tras
// refrescar en silencio antes de devolver el 401 — nunca en /login (un 401 ahí
// es credenciales inválidas, no sesión expirada) ni en el propio /refresh
// (evita loop).
export async function apiFetch(url, opciones = {}) {
  const { body, headers, ...resto } = opciones
  const esJson = body != null && typeof body === 'object' && !(body instanceof FormData)
  const config = {
    credentials: 'include',
    ...resto,
    headers: esJson ? { 'Content-Type': 'application/json', ...headers } : headers,
    body: esJson ? JSON.stringify(body) : body,
  }

  let res = await fetch(url, config)

  const refreshUrl = endpointRefreshPara(url)
  const esLoginORefresh = url.includes('/login') || url.endsWith('/refresh')
  if (res.status === 401 && refreshUrl && !esLoginORefresh) {
    const refrescada = await refrescarSesion(refreshUrl)
    if (refrescada) res = await fetch(url, config)
  }

  const datos = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, datos }
}
