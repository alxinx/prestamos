'use strict'

const React = require('react')
const { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } = require('@react-pdf/renderer')
const { formatearPrecio } = require('../../emails/helpers')

const h = React.createElement

// Voucher de pago — a propósito SIN logo, marca, firma ni datos de contacto
// del negocio (spec del usuario 2026-07-23, PARTE 5: "RESTRICCIONES DEL
// VOUCHER"). Solo la información de la transacción — nada que identifique al
// tenant más allá de lo estrictamente necesario para el registro.
const estilos = StyleSheet.create({
  page: { paddingTop: 28, paddingHorizontal: 30, paddingBottom: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#0b1c30' },

  titulo: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  subtitulo: { fontSize: 8, color: '#43474f', marginBottom: 10 },

  filaDatos: { flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1px solid #c4c6d0', paddingBottom: 8, marginBottom: 10 },
  datoEtiqueta: { fontSize: 7, color: '#747780', textTransform: 'uppercase', marginBottom: 2 },
  datoValor: { fontSize: 9, fontFamily: 'Helvetica-Bold' },

  seccionTitulo: { fontSize: 9, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginTop: 8, marginBottom: 6, borderBottom: '1px solid #c4c6d0', paddingBottom: 3 },

  resumenFila: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  resumenEtiqueta: { fontSize: 9, color: '#43474f' },
  resumenValor: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  resumenValorDestacado: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#006d43' },

  cuotaBox: { border: '1px solid #c4c6d0', borderRadius: 4, padding: 8, marginBottom: 6 },
  cuotaTitulo: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  cuotaFila: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1 },
  cuotaEtiqueta: { fontSize: 8, color: '#43474f' },
  cuotaValor: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  cuotaTotalFila: { flexDirection: 'row', justifyContent: 'space-between', borderTop: '1px solid #c4c6d0', marginTop: 4, paddingTop: 3 },

  estadoBox: { borderRadius: 4, padding: 10, marginTop: 10, textAlign: 'center' },
  estadoAlDia: { backgroundColor: '#eafdf5', border: '1px solid #56fbab' },
  estadoEnMora: { backgroundColor: '#ffdad6', border: '1px solid #ba1a1a' },
  estadoTexto: { fontSize: 9, fontFamily: 'Helvetica-Bold' },

  footer: { position: 'absolute', bottom: 20, left: 30, right: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerTexto: { fontSize: 6, color: '#747780', width: 350 },
  footerQr: { width: 40, height: 40 },
})

function filaResumen(etiqueta, valor, destacado = false) {
  return h(View, { style: estilos.resumenFila },
    h(Text, { style: estilos.resumenEtiqueta }, etiqueta),
    h(Text, { style: destacado ? estilos.resumenValorDestacado : estilos.resumenValor }, formatearPrecio(valor)),
  )
}

function boxCuota(cuota) {
  return h(View, { key: cuota.numero ?? 'periodo', style: estilos.cuotaBox, wrap: false },
    h(Text, { style: estilos.cuotaTitulo },
      cuota.numero != null ? `Cuota N°${cuota.numero}${cuota.fecha ? ` — Vencía: ${cuota.fecha}` : ''}` : 'Abono'),
    h(View, { style: estilos.cuotaFila },
      h(Text, { style: estilos.cuotaEtiqueta }, cuota.etiquetaRecargos ?? 'Recargos'),
      h(Text, { style: estilos.cuotaValor }, formatearPrecio(cuota.valorRecargos))),
    h(View, { style: estilos.cuotaFila },
      h(Text, { style: estilos.cuotaEtiqueta }, 'Interés'),
      h(Text, { style: estilos.cuotaValor }, formatearPrecio(cuota.valorIntereses))),
    h(View, { style: estilos.cuotaFila },
      h(Text, { style: estilos.cuotaEtiqueta }, 'Capital'),
      h(Text, { style: estilos.cuotaValor }, formatearPrecio(cuota.valorCapital))),
    h(View, { style: estilos.cuotaTotalFila },
      h(Text, { style: { ...estilos.cuotaEtiqueta, fontFamily: 'Helvetica-Bold' } }, 'Total aplicado'),
      h(Text, { style: estilos.cuotaValor }, formatearPrecio(cuota.totalAplicado))),
  )
}

// `datos`: codigoPrestamo, clienteNombre, fecha (string ya formateada, con
// hora), registradoPor (nombre del cobrador, o null si lo registró un rol de
// oficina), saldoAnterior, montoRecibido, saldoNuevo, cuotas (array de
// {numero, fecha, valorRecargos, valorIntereses, valorCapital, totalAplicado}
// — numero/fecha null si el crédito no tiene cuotas fijas), alDia (boolean),
// proximaCuota ({valor, fecha} o null), saldoVencidoPendiente (solo si
// !alDia), qrPngDataUri.
function VoucherPagoDocumento(datos) {
  const {
    codigoPrestamo, clienteNombre, fecha, registradoPor,
    saldoAnterior, montoRecibido, saldoNuevo,
    cuotas, alDia, proximaCuota, saldoVencidoPendiente,
    qrPngDataUri,
  } = datos

  return h(Document, {},
    h(Page, { size: 'A4', style: estilos.page },
      h(Text, { style: estilos.titulo }, 'Comprobante de pago'),
      h(Text, { style: estilos.subtitulo }, `Préstamo ${codigoPrestamo}`),

      h(View, { style: estilos.filaDatos },
        h(View, {},
          h(Text, { style: estilos.datoEtiqueta }, 'Cliente'),
          h(Text, { style: estilos.datoValor }, clienteNombre),
        ),
        h(View, {},
          h(Text, { style: estilos.datoEtiqueta }, 'Fecha y hora'),
          h(Text, { style: estilos.datoValor }, fecha),
        ),
        h(View, {},
          h(Text, { style: estilos.datoEtiqueta }, 'Registrado por'),
          h(Text, { style: estilos.datoValor }, registradoPor ?? 'Registrado por administración'),
        ),
      ),

      h(Text, { style: estilos.seccionTitulo }, 'Resumen de saldo'),
      filaResumen('Saldo anterior', saldoAnterior),
      filaResumen('Abono aplicado', montoRecibido, true),
      filaResumen('Saldo nuevo', saldoNuevo),

      h(Text, { style: estilos.seccionTitulo }, 'Distribución del abono'),
      ...cuotas.map(boxCuota),

      h(View, { style: { ...estilos.estadoBox, ...(alDia ? estilos.estadoAlDia : estilos.estadoEnMora) } },
        h(Text, { style: estilos.estadoTexto },
          alDia
            ? (proximaCuota
                ? `Crédito al día. Próxima cuota: ${formatearPrecio(proximaCuota.valor)} — Vence ${proximaCuota.fecha}`
                : 'Crédito al día.')
            : `Aún en mora. Saldo vencido pendiente: ${formatearPrecio(saldoVencidoPendiente)}`),
      ),

      h(View, { style: estilos.footer, fixed: true },
        h(Text, { style: estilos.footerTexto },
          'Comprobante generado automáticamente al registrar el abono. Escanea el código para verificar su autenticidad.'),
        h(Image, { style: estilos.footerQr, src: qrPngDataUri }),
      ),
    ),
  )
}

async function generarVoucherPago(datos) {
  return renderToBuffer(h(VoucherPagoDocumento, datos))
}

module.exports = { generarVoucherPago }
