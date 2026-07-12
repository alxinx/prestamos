import { formatearPrecio, formatearFechaHora } from './formato'

// Escapa vía textContent (nunca concatenación directa) — nombreContraparte es texto
// libre ingresado por el usuario y termina inyectado en el HTML de la pestaña nueva.
function escaparHtml(texto) {
  const div = document.createElement('div')
  div.textContent = String(texto ?? '')
  return div.innerHTML
}

// Abre la pestaña en blanco — debe llamarse de forma síncrona, en la primera línea
// del manejador de clic, antes de cualquier await. Los navegadores solo conceden
// window.open() sin bloqueo mientras dura el gesto del usuario; si se llama después
// de esperar una respuesta del backend, el gesto ya se perdió y la pestaña queda
// bloqueada o en blanco. `escribirTirillaAjusteCapital` rellena esta pestaña luego,
// una vez que el comprobante ya está listo.
export function abrirVentanaTirilla() {
  return window.open('', '_blank')
}

// Escribe el comprobante en una pestaña ya abierta con abrirVentanaTirilla(). Si la
// pestaña no se pudo abrir (bloqueada por el navegador), no hace nada.
export function escribirTirillaAjusteCapital(ventana, comprobante) {
  if (!ventana) return
  const {
    tenantNombre, fecha, tipo, nombreCapital, codigoCapital,
    valorAnterior, valorNuevo, monto, nombreAutor, nombreContraparte, qrSvg,
  } = comprobante

  const esAgregar = tipo === 'AGREGAR'
  const etiquetaTipo = esAgregar ? 'CAPITAL AGREGADO' : 'CAPITAL RETIRADO'
  const etiquetaContraparte = esAgregar ? 'Recibido de' : 'Entregado a'
  const colorTipo = esAgregar ? '#006d43' : '#ba1a1a'

  // "Apertura de capital" no tiene contraparte — se omiten esa fila y su firma.
  const filaContraparte = nombreContraparte
    ? `<div class="fila"><span class="etq">${etiquetaContraparte}</span><span class="val">${escaparHtml(nombreContraparte)}</span></div>`
    : ''
  const firmaContraparte = nombreContraparte
    ? `<div><div class="linea-firma">Firma de ${escaparHtml(nombreContraparte)}</div></div>`
    : ''

  // qrSvg viene ya generado del backend (src/lib/qr.js) a partir del token de
  // verificación — nunca se manda el token en crudo al frontend, y el SVG no se
  // escapa porque es marcado nuestro (no texto libre del usuario).
  const bloqueQr = qrSvg
    ? `<div class="qr">${qrSvg}</div><p class="qr-caption">Escanea para verificar este documento</p>`
    : ''

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Comprobante de ajuste de capital</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 24px 12px;
    background: #e5eeff;
    font-family: 'Courier New', monospace;
    display: flex;
    justify-content: center;
  }
  .tirilla {
    width: 320px;
    max-width: 100%;
    background: #ffffff;
    padding: 20px 18px 24px;
    box-shadow: 0 4px 24px rgba(0,40,85,0.12);
  }
  .centro { text-align: center; }
  .tenant { font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 2px; color: #001430; }
  .fecha { font-size: 11px; color: #43474f; margin: 0 0 14px; }
  .divisor { border: none; border-top: 1px dashed #747780; margin: 14px 0; }
  .tipo { font-size: 20px; font-weight: 800; letter-spacing: 0.02em; margin: 4px 0 16px; color: ${colorTipo}; }
  .fila { display: flex; justify-content: space-between; gap: 12px; font-size: 12.5px; padding: 4px 0; color: #0b1c30; }
  .fila .etq { color: #43474f; }
  .fila .val { font-weight: 700; text-align: right; }
  .destacado .val { font-size: 14px; color: ${colorTipo}; }
  .firmas { display: flex; gap: 20px; margin-top: 46px; }
  .firmas > div { flex: 1; }
  .linea-firma { border-top: 1px solid #0b1c30; padding-top: 6px; font-size: 10.5px; text-align: center; color: #43474f; }
  .qr { display: flex; justify-content: center; margin-top: 18px; }
  .qr svg { width: 112px; height: 112px; }
  .qr-caption { text-align: center; font-size: 10px; color: #43474f; margin: 4px 0 0; }
  .btn-imprimir {
    display: block; width: 320px; max-width: 100%; margin: 14px auto 0;
    padding: 10px; border: none; border-radius: 8px; background: #001430; color: #fff;
    font-family: system-ui, sans-serif; font-size: 13px; font-weight: 600; cursor: pointer;
  }
  @media print {
    body { background: #fff; padding: 0; }
    .tirilla { box-shadow: none; padding: 0; }
    .btn-imprimir { display: none; }
  }
</style>
</head>
<body>
  <div>
    <div class="tirilla">
      <div class="centro">
        <p class="tenant">${escaparHtml(tenantNombre)}</p>
        <p class="fecha">${escaparHtml(formatearFechaHora(fecha))}</p>
      </div>
      <hr class="divisor" />
      <div class="centro">
        <p class="tipo">${etiquetaTipo}</p>
      </div>
      <div class="fila"><span class="etq">Capital</span><span class="val">${escaparHtml(nombreCapital)}</span></div>
      <div class="fila"><span class="etq">Código</span><span class="val">${escaparHtml(codigoCapital)}</span></div>
      <hr class="divisor" />
      <div class="fila"><span class="etq">Valor anterior</span><span class="val">${escaparHtml(formatearPrecio(valorAnterior))}</span></div>
      <div class="fila"><span class="etq">Valor nuevo</span><span class="val">${escaparHtml(formatearPrecio(valorNuevo))}</span></div>
      <div class="fila destacado"><span class="etq">${esAgregar ? 'Monto agregado' : 'Monto retirado'}</span><span class="val">${escaparHtml(formatearPrecio(monto))}</span></div>
      <hr class="divisor" />
      <div class="fila"><span class="etq">Autorizado por</span><span class="val">${escaparHtml(nombreAutor)}</span></div>
      ${filaContraparte}

      <div class="firmas">
        <div><div class="linea-firma">Firma de ${escaparHtml(nombreAutor)}</div></div>
        ${firmaContraparte}
      </div>

      ${bloqueQr}
    </div>
    <button class="btn-imprimir" onclick="window.print()">Imprimir / Guardar como PDF</button>
  </div>
</body>
</html>`

  ventana.document.open()
  ventana.document.write(html)
  ventana.document.close()
}

// Atajo para los casos sin espera async previa (ej. reimprimir un movimiento ya
// cargado en memoria) — abre y escribe en el mismo tick, sin riesgo de bloqueo.
export function abrirTirillaAjusteCapital(comprobante) {
  escribirTirillaAjusteCapital(abrirVentanaTirilla(), comprobante)
}
