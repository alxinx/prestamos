'use strict'

// Prefijos exactos que escribe capital.service.js (ajustarCapital) en `observaciones`
// — se usan para recuperar el nombre de la contraparte tanto al reimprimir el voucher
// desde el historial como al verificarlo públicamente, sin agregar una columna nueva
// solo para este dato.
const PREFIJOS_CONTRAPARTE = ['Aporte recibido de: ', 'Retiro entregado a: ']

function extraerContraparte(observaciones) {
  for (const prefijo of PREFIJOS_CONTRAPARTE) {
    if (observaciones?.startsWith(prefijo)) return observaciones.slice(prefijo.length)
  }
  return null
}

module.exports = { extraerContraparte }
