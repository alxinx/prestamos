// Borrador en memoria del wizard "Nuevo préstamo" (pages/tenant/NuevoPrestamo.jsx)
// — vive solo mientras dura la pestaña del navegador, nunca en localStorage ni
// sessionStorage: así se conservan intactos los archivos de la garantía
// adjunta (File no es serializable a JSON) y un borrador olvidado no sobrevive
// a un cierre real del navegador.
//
// Se usa cuando el operador, a mitad del wizard, se da cuenta de que el
// cliente no existe: guarda el avance antes de ir a /clientes/nuevo, y al
// volver con ?clienteId=... (mismo flujo "Guardar y crear préstamo" que ya
// existía en NuevoCliente.jsx) el wizard lo restaura automáticamente.
let borrador = null

export function guardarBorradorPrestamo(datos) {
  borrador = datos
}

// Lectura no destructiva a propósito — nunca limpiar acá. Si se limpiara al
// leer, el doble-montaje de efectos de React.StrictMode en desarrollo (monta
// → desmonta → vuelve a montar) leería null la segunda vez y perdería el
// borrador antes de que el operador llegue a verlo. Se limpia explícitamente
// desde NuevoPrestamo.jsx una vez que el crédito ya quedó creado.
export function obtenerBorradorPrestamo() {
  return borrador
}

export function limpiarBorradorPrestamo() {
  borrador = null
}
