// Nominatim no entiende abreviaturas colombianas (busca por el nombre de vía
// tal como está tageado en OSM, casi siempre en texto completo) — expandirlas
// antes de consultar mejora el acierto. Patrones fijos, sin backtracking, no
// construidos desde input libre: no hay riesgo de ReDoS.
// El punto va DESPUÉS del \b, no antes: "Cl." tiene el boundary entre "l" y "."
// (dos no-letras seguidas, como ". " nunca forman boundary entre sí), así que
// \bcl\.?\b dejaba el punto suelto sin consumir ("Cl." -> "Calle.").
const ABREVIATURAS = [
  [/\bcl\b\.?/gi, 'Calle'],
  [/\bcll\b\.?/gi, 'Calle'],
  [/\bcra\b\.?/gi, 'Carrera'],
  [/\bcr\b\.?/gi, 'Carrera'],
  [/\bkra\b\.?/gi, 'Carrera'],
  [/\bkr\b\.?/gi, 'Carrera'],
  [/\btv\b\.?/gi, 'Transversal'],
  [/\bdg\b\.?/gi, 'Diagonal'],
  [/\bdiag\b\.?/gi, 'Diagonal'],
  [/\bav\b\.?/gi, 'Avenida'],
  [/\bmz\b\.?/gi, 'Manzana'],
]

function normalizarDireccion(direccion) {
  return ABREVIATURAS
    .reduce((texto, [patron, reemplazo]) => texto.replace(patron, reemplazo), direccion)
    .replace(/\s+/g, ' ')
    .trim()
}

// Geocodificación de direcciones vía Nominatim (OpenStreetMap) — gratis, sin API
// key, mismo proveedor que ya usan los tiles del mapa (MapaSeleccionUbicacion.jsx).
// Se llama con debounce desde el formulario (nunca en cada tecla) para respetar
// el uso moderado que espera el servicio público de Nominatim.
//
// Limitación real, no un bug: Nominatim/OSM no modela el sistema de nomenclatura
// colombiano (calle/carrera + cruce + metros, ej. "Cl 102A # 22A-72") — descarta
// el "# 22A-72" por completo y busca solo "Calle 102A", que puede repetirse en
// varias comunas distintas y lejanas entre sí dentro de la misma ciudad. El
// barrio es lo único que desambigua de forma confiable en esos casos — por eso
// se manda siempre que el usuario lo llene, y la UI recuerda verificar el pin.
export async function geocodificarDireccion({ direccion, barrio, ciudad }) {
  const partes = [direccion && normalizarDireccion(direccion), barrio, ciudad, 'Colombia'].map(p => p?.trim()).filter(Boolean)
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
