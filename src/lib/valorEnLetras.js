'use strict'

const { NumerosALetras } = require('numero-a-letras')

// numero-a-letras@1.0.6 inserta "de" incorrectamente entre "Millón/Millones" y el
// resto de la cifra cuando no es una cifra exacta de millones (ej. "Un Millón de
// Doscientos Mil Pesos" en vez de "Un Millón Doscientos Mil Pesos"), y a veces deja
// doble espacio — se corrige acá antes de imprimir el valor en un documento legal.
function corregirGramatica(texto) {
  return texto
    .replace(/(Mill[oó]n(?:es)?) de (?!Pesos\b)/gi, '$1 ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Convierte un monto en pesos colombianos a su representación en letras, para
// documentos legales (letra de cambio) que exigen el valor tanto en números
// como en letras. `valor` puede ser un Decimal de Prisma o un number — nunca
// se persiste el resultado, se genera al vuelo cada vez que se imprime el documento.
// En mayúsculas: convención de los títulos valores colombianos (dificulta alterar
// el texto agregando palabras, igual que en un cheque).
function valorEnLetras(valor) {
  return corregirGramatica(NumerosALetras(Number(valor))).toUpperCase()
}

module.exports = { valorEnLetras }
