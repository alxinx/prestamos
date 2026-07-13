// Geocodificación de direcciones vía Nominatim (OpenStreetMap) — gratis, sin API
// key, mismo proveedor que ya usan los tiles del mapa (MapaSeleccionUbicacion.jsx).
// Se llama con debounce desde el formulario (nunca en cada tecla) para respetar
// el uso moderado que espera el servicio público de Nominatim.
export async function geocodificarDireccion({ direccion, barrio, ciudad }) {
  const partes = [direccion, barrio, ciudad, 'Colombia'].map(p => p?.trim()).filter(Boolean)
  if (partes.length < 2) return null

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=co&q=${encodeURIComponent(partes.join(', '))}`

  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const resultados = await res.json()
    if (!Array.isArray(resultados) || resultados.length === 0) return null
    const [{ lat, lon }] = resultados
    return { latitud: Number(Number(lat).toFixed(6)), longitud: Number(Number(lon).toFixed(6)) }
  } catch {
    return null
  }
}
