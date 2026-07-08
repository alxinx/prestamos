// Helper DRY de fetch — centraliza `credentials: 'include'`, el JSON.stringify del body
// y el parseo de la respuesta, que antes se repetían a mano en cada página.
export async function apiFetch(url, opciones = {}) {
  const { body, headers, ...resto } = opciones
  const esJson = body != null && typeof body === 'object' && !(body instanceof FormData)

  const res = await fetch(url, {
    credentials: 'include',
    ...resto,
    headers: esJson ? { 'Content-Type': 'application/json', ...headers } : headers,
    body: esJson ? JSON.stringify(body) : body,
  })

  const datos = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, datos }
}
