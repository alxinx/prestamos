'use strict'

const path = require('path')
const React = require('react')
const { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } = require('@react-pdf/renderer')
const { formatearPrecio } = require('../../emails/helpers')
const { ETIQUETAS_FRECUENCIA } = require('../creditosConstantes')

const h = React.createElement

// PNG local (no la URL del logo que usan los emails) — el motor de render de
// @react-pdf/renderer (pdfkit) no soporta WebP, solo PNG/JPEG. Convertido una
// sola vez desde frontend/public/logotipo_sin slogan.webp (ver comentario en
// el script que lo generó — no se regenera en cada build).
const LOGO_PATH = path.join(__dirname, 'assets', 'logo-gotapay.png')

// Tokens de marca (CLAUDE.md §5) — el subconjunto que aplica a un documento
// PDF (papel blanco, sin fondo `background` de la app).
const COLOR = {
  navy: '#001430',
  navyClaro: '#aac7fd',
  verde: '#006d43',
  verdeContainer: '#56fbab',
  verdeFondo: '#eafdf5',
  texto: '#0b1c30',
  textoSecundario: '#43474f',
  textoTenue: '#747780',
  borde: '#c4c6d0',
  bordeSuave: '#e5e7eb',
}

// pdfkit no trae Hanken Grotesk — usar Helvetica (fuente base, siempre
// disponible, cero dependencia de red al generar) en vez de intentar
// descargar la fuente en cada render. Es un documento, no una pantalla de la
// app — el CLAUDE.md de tipografía aplica al producto, no a este PDF.
const estilos = StyleSheet.create({
  // paddingBottom generoso a propósito: reserva espacio para el footer `fixed`
  // (texto legal de 3 párrafos + banda de contacto/QR) para que el contenido
  // que fluye normalmente (la tabla del plan de pagos, en créditos con muchas
  // cuotas) nunca quede debajo/tapado por él — pdfkit no reserva ese espacio
  // solo porque el footer sea `fixed`, hay que dárselo explícito acá.
  page: { paddingTop: 28, paddingHorizontal: 28, paddingBottom: 150, fontSize: 9, fontFamily: 'Helvetica', color: COLOR.texto },

  headerFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 12, borderBottom: `2px solid ${COLOR.verde}`, marginBottom: 14 },
  logo: { width: 110, height: 35, objectFit: 'contain' },
  headerDerecha: { alignItems: 'flex-end' },
  headerTitulo: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: COLOR.navy, marginBottom: 3 },
  headerSub: { fontSize: 8, color: COLOR.textoTenue, marginBottom: 1 },
  headerId: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLOR.verde },

  tarjetasFila: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  tarjeta: { flex: 1, border: `1px solid ${COLOR.bordeSuave}`, borderRadius: 8, padding: 10 },
  tarjetaEtiqueta: { fontSize: 7, color: COLOR.textoTenue, marginBottom: 2, textTransform: 'uppercase' },
  tarjetaValor: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLOR.texto, marginBottom: 6 },

  bandaNavy: { backgroundColor: COLOR.navy, borderRadius: 10, padding: 12, flexDirection: 'row', marginBottom: 10 },
  bandaCelda: { flex: 1, alignItems: 'center' },
  bandaEtiqueta: { fontSize: 7, color: COLOR.navyClaro, textTransform: 'uppercase', marginBottom: 4, textAlign: 'center' },
  bandaValor: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#ffffff', textAlign: 'center' },
  bandaValorVerde: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLOR.verdeContainer, textAlign: 'center' },

  seccionTitulo: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLOR.texto, marginBottom: 6 },

  tablaHeaderFila: { flexDirection: 'row', backgroundColor: COLOR.verde, borderRadius: 4 },
  tablaHeaderCelda: { padding: 5, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#ffffff', textAlign: 'center' },
  tablaFila: { flexDirection: 'row', borderBottom: `1px solid ${COLOR.bordeSuave}` },
  tablaFilaPar: { backgroundColor: COLOR.verdeFondo },
  tablaFilaFinal: { backgroundColor: COLOR.verdeFondo, fontFamily: 'Helvetica-Bold' },
  tablaCelda: { padding: 5, fontSize: 8, textAlign: 'center', color: COLOR.textoSecundario },

  resumenFila: { flexDirection: 'row', border: `1px solid ${COLOR.bordeSuave}`, borderRadius: 8, padding: 8, marginTop: 10, marginBottom: 10 },
  resumenCelda: { flex: 1, alignItems: 'center' },
  resumenEtiqueta: { fontSize: 6.5, color: COLOR.textoTenue, textTransform: 'uppercase', marginBottom: 3, textAlign: 'center' },
  resumenValor: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLOR.verde, textAlign: 'center' },

  notaBox: { border: `1px solid ${COLOR.verde}`, backgroundColor: COLOR.verdeFondo, borderRadius: 8, padding: 10, marginBottom: 18 },
  notaTitulo: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: COLOR.verde, marginBottom: 3 },
  notaTexto: { fontSize: 7.5, color: COLOR.textoSecundario, lineHeight: 1.4 },

  footer: { position: 'absolute', bottom: 24, left: 28, right: 28 },
  footerLegal: { fontSize: 6, color: COLOR.textoTenue, lineHeight: 1.5, marginBottom: 10, borderTop: `1px solid ${COLOR.bordeSuave}`, paddingTop: 8 },
  footerBandaNavy: { backgroundColor: COLOR.navy, borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerMarca: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  footerContacto: { fontSize: 6.5, color: COLOR.navyClaro, marginTop: 2 },
  footerQrBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerQrTexto: { fontSize: 6, color: COLOR.navyClaro, width: 46, lineHeight: 1.3 },
  footerQrImg: { width: 34, height: 34, backgroundColor: '#ffffff', padding: 2, borderRadius: 3 },
})

function celda(etiqueta, valor, estiloValor = estilos.bandaValor) {
  return h(View, { style: estilos.bandaCelda },
    h(Text, { style: estilos.bandaEtiqueta }, etiqueta),
    h(Text, { style: estiloValor }, valor),
  )
}

function celdaResumen(etiqueta, valor) {
  return h(View, { style: estilos.resumenCelda },
    h(Text, { style: estilos.resumenEtiqueta }, etiqueta),
    h(Text, { style: estilos.resumenValor }, valor),
  )
}

function filaTabla(cuota, esFinal) {
  const estiloFila = esFinal
    ? { ...estilos.tablaFila, ...estilos.tablaFilaFinal }
    : (cuota.numero % 2 === 0 ? { ...estilos.tablaFila, ...estilos.tablaFilaPar } : estilos.tablaFila)
  // wrap=false: sin esto, pdfkit puede partir una fila a la mitad entre dos
  // páginas (las celdas de la izquierda quedan en una página, las de la
  // derecha en la siguiente) — con wrap=false la fila entera salta completa a
  // la página siguiente si no cabe.
  return h(View, { key: cuota.numero, style: estiloFila, wrap: false },
    h(Text, { style: { ...estilos.tablaCelda, flex: 0.6 } }, String(cuota.numero)),
    h(Text, { style: { ...estilos.tablaCelda, flex: 1.4 } }, cuota.fecha),
    h(Text, { style: { ...estilos.tablaCelda, flex: 1.4 } }, formatearPrecio(cuota.capital)),
    h(Text, { style: { ...estilos.tablaCelda, flex: 1.4 } }, formatearPrecio(cuota.interes)),
    h(Text, { style: { ...estilos.tablaCelda, flex: 1.4 } }, formatearPrecio(cuota.totalCuota)),
    h(Text, { style: { ...estilos.tablaCelda, flex: 1.4 } }, formatearPrecio(cuota.saldo)),
  )
}

// Relación del deudor solidario con el deudor principal — mismo catálogo que
// RELACIONES_PERSONA en creditos.validator.js, solo para mostrar la etiqueta.
const ETIQUETAS_RELACION_DEUDOR = { FAMILIAR: 'Familiar', AMIGO: 'Amigo', COLEGA: 'Colega', VECINO: 'Vecino', OTRO: 'Otro' }

// `datos` — todos los valores monetarios ya en Number (el caller convierte
// desde Prisma.Decimal con .toNumber() antes de llamar acá, este módulo es
// puro de presentación). `cronograma` — array de calcularCronogramaCredito
// con fecha/capital/interes/totalCuota/saldo ya como Number/string formateada.
// `deudorSolidario` — null si el crédito no tiene, o { nombreCompleto, cedula,
// telefono, relacionConDeudor } si sí (decisión 2026-07-18: reemplaza a
// cobrador/caja en la segunda tarjeta — esos datos operativos ya no van en
// este documento, solo datos del cliente y, si aplica, del codeudor).
function ResumenPrestamoDocumento(datos) {
  const {
    idPrestamo, fechaGeneracion, tenantNombre,
    cliente, deudorSolidario,
    montoInicial, tasaInteres, frecuenciaPago, numeroCuotas, plazoTexto,
    valorCuota, totalAPagar, totalIntereses,
    esSoloIntereses, valorPeriodico,
    cronograma, urlVerificacion, qrPngDataUri,
  } = datos

  const frecuenciaEtiqueta = ETIQUETAS_FRECUENCIA[frecuenciaPago] || frecuenciaPago

  return h(Document, {},
    h(Page, { size: 'A4', style: estilos.page },

      // Header
      h(View, { style: estilos.headerFila },
        h(Image, { style: estilos.logo, src: LOGO_PATH }),
        h(View, { style: estilos.headerDerecha },
          h(Text, { style: estilos.headerTitulo }, 'Resumen de préstamo'),
          h(Text, { style: estilos.headerSub }, `Documento generado el ${fechaGeneracion}`),
          h(Text, { style: estilos.headerId }, `ID Préstamo: ${idPrestamo}`),
        ),
      ),

      // Tarjetas — cliente (siempre) y deudor solidario (solo si el crédito tiene uno)
      h(View, { style: estilos.tarjetasFila },
        h(View, { style: estilos.tarjeta },
          h(Text, { style: estilos.tarjetaEtiqueta }, 'Cliente'),
          h(Text, { style: estilos.tarjetaValor }, cliente.nombreCompleto),
          h(Text, { style: { fontSize: 8, color: COLOR.textoSecundario } }, `Cédula: ${cliente.cedula}`),
          h(Text, { style: { fontSize: 8, color: COLOR.textoSecundario } }, cliente.telefono),
          cliente.email ? h(Text, { style: { fontSize: 8, color: COLOR.textoSecundario } }, cliente.email) : null,
        ),
        deudorSolidario && h(View, { style: estilos.tarjeta },
          h(Text, { style: estilos.tarjetaEtiqueta }, 'Deudor solidario'),
          h(Text, { style: estilos.tarjetaValor }, deudorSolidario.nombreCompleto),
          h(Text, { style: { fontSize: 8, color: COLOR.textoSecundario } }, `Cédula: ${deudorSolidario.cedula}`),
          h(Text, { style: { fontSize: 8, color: COLOR.textoSecundario } }, deudorSolidario.telefono),
          h(Text, { style: { fontSize: 8, color: COLOR.textoSecundario } },
            `Relación: ${ETIQUETAS_RELACION_DEUDOR[deudorSolidario.relacionConDeudor] || deudorSolidario.relacionConDeudor}`),
        ),
      ),

      // Banda de estadísticas
      h(View, { style: estilos.bandaNavy },
        celda('Valor prestado', formatearPrecio(montoInicial), estilos.bandaValorVerde),
        celda('Tasa de interés', `${tasaInteres}% ${frecuenciaEtiqueta}`),
        esSoloIntereses
          ? celda(`Interés ${frecuenciaEtiqueta.toLowerCase()}`, formatearPrecio(valorPeriodico), estilos.bandaValorVerde)
          : celda('Plazo', plazoTexto),
        esSoloIntereses
          ? celda('Modalidad', 'Solo intereses')
          : celda('Valor de la cuota', formatearPrecio(valorCuota)),
        esSoloIntereses ? null : celda('Total a pagar', formatearPrecio(totalAPagar), estilos.bandaValorVerde),
      ),

      // Plan de pagos (crédito con plazo fijo) o nota de solo intereses
      esSoloIntereses
        ? h(View, { style: estilos.notaBox },
            h(Text, { style: estilos.notaTitulo }, 'Crédito de solo intereses'),
            h(Text, { style: estilos.notaTexto },
              `Este préstamo cobra ${tasaInteres}% (${frecuenciaEtiqueta.toLowerCase()}) sobre el capital de forma indefinida, sin plazo ni fecha de vencimiento fija. ` +
              `El capital de ${formatearPrecio(montoInicial)} se paga aparte, cuando el cliente decida.`),
          )
        : h(View, {},
            h(Text, { style: estilos.seccionTitulo }, 'Plan de pagos'),
            h(View, { style: estilos.tablaHeaderFila, wrap: false },
              h(Text, { style: { ...estilos.tablaHeaderCelda, flex: 0.6 } }, 'Nº'),
              h(Text, { style: { ...estilos.tablaHeaderCelda, flex: 1.4 } }, 'Fecha de pago'),
              h(Text, { style: { ...estilos.tablaHeaderCelda, flex: 1.4 } }, 'Capital'),
              h(Text, { style: { ...estilos.tablaHeaderCelda, flex: 1.4 } }, 'Interés'),
              h(Text, { style: { ...estilos.tablaHeaderCelda, flex: 1.4 } }, 'Total cuota'),
              h(Text, { style: { ...estilos.tablaHeaderCelda, flex: 1.4 } }, 'Saldo'),
            ),
            ...cronograma.map((c, i) => filaTabla(c, i === cronograma.length - 1)),

            h(View, { style: estilos.resumenFila, wrap: false },
              celdaResumen('Total intereses', formatearPrecio(totalIntereses)),
              celdaResumen('Total pagado', formatearPrecio(totalAPagar)),
              celdaResumen('Número de cuotas', String(numeroCuotas)),
              celdaResumen('Frecuencia de pago', frecuenciaEtiqueta),
            ),

            h(View, { style: estilos.notaBox, wrap: false },
              h(Text, { style: estilos.notaTitulo }, 'Importante'),
              h(Text, { style: estilos.notaTexto },
                'Este cronograma está sujeto a las condiciones del préstamo. En caso de pagos anticipados, abonos parciales o modificaciones al crédito, los valores pueden variar.'),
            ),
          ),

      // Footer — texto legal + banda de contacto/QR
      h(View, { style: estilos.footer, fixed: true },
        h(Text, { style: estilos.footerLegal },
          'Este documento es informativo y fue generado automáticamente con base en los parámetros del préstamo. No constituye un título valor ni un documento legal por sí mismo. Los valores pueden variar ante pagos anticipados, abonos parciales o modificaciones al crédito.\n\n' +
          `Este documento fue generado automáticamente por GotaPay (www.gotapay.net), plataforma tecnológica de gestión de préstamos. GotaPay no es parte de la relación crediticia aquí descrita y no asume responsabilidad sobre los valores, tasas o condiciones pactadas, las cuales fueron configuradas exclusivamente por ${tenantNombre}.\n\n` +
          'Este documento es de carácter informativo. No constituye un título valor ni un instrumento jurídicamente vinculante. Los valores proyectados están sujetos a variación ante pagos anticipados, abonos parciales o reestructuraciones del crédito.'),
        h(View, { style: estilos.footerBandaNavy },
          h(View, {},
            h(Text, { style: estilos.footerMarca }, 'GotaPay'),
            h(Text, { style: estilos.footerContacto }, 'www.gotapay.net'),
          ),
          h(View, { style: estilos.footerQrBox },
            h(Text, { style: estilos.footerQrTexto }, 'Escanea para verificar este documento'),
            h(Image, { style: estilos.footerQrImg, src: qrPngDataUri }),
          ),
        ),
      ),
    ),
  )
}

async function generarPdfResumenPrestamo(datos) {
  return renderToBuffer(h(ResumenPrestamoDocumento, datos))
}

module.exports = { generarPdfResumenPrestamo }
