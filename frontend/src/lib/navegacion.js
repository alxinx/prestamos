// Navegación programática dentro del router SPA propio (ver App.jsx) — para usar
// después de una acción async (ej. tras guardar un formulario) donde no hay un
// <a> que el interceptor de clics del router pueda atrapar. Un <a href> normal
// no necesita esto: ya lo intercepta App.jsx.
export function navegarA(ruta) {
  window.history.pushState({}, '', ruta)
  window.dispatchEvent(new Event('navegacion-spa'))
  window.scrollTo(0, 0)
}
