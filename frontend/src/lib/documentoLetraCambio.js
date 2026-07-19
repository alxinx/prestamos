import { formatearPrecio, formatearFechaLocal, formatearFechaHora } from './formato'

// Escapa vía textContent (nunca concatenación directa) — cualquier texto libre
// (beneficiario, nombre del deudor) termina inyectado en el HTML de la pestaña
// nueva. Mismo patrón que tirillaCapital.js.
function escaparHtml(texto) {
  const div = document.createElement('div')
  div.textContent = String(texto ?? '')
  return div.innerHTML
}

// Abre la pestaña en blanco — debe llamarse de forma síncrona, en la primera
// línea del manejador de clic, antes de cualquier await (mismo motivo que
// tirillaCapital.js: el gesto de clic del usuario se pierde después de un await
// a la API y el navegador bloquea el popup o lo deja en blanco).
export function abrirVentanaImprimible() {
  return window.open('', '_blank')
}

// Línea punteada para diligenciar a mano lo que no tiene dato (blanco legal,
// Art. 622 C.Co. — válido solo junto con la carta de instrucciones).
function lineaOValor(valor) {
  return valor ? escaparHtml(valor) : '<span class="blanco">_______________________</span>'
}

const ESTILOS_BASE = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 24px;
    background: #e5eeff;
    font-family: Georgia, 'Times New Roman', serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .hoja {
    width: 21.59cm;
    height: 13.97cm;
    max-width: 100%;
    background: #ffffff;
    box-shadow: 0 4px 24px rgba(0,40,85,0.12);
    padding: 1cm;
    color: #111;
    position: relative;
  }
  .marca { position: absolute; top: 0.6cm; right: 1cm; font-family: system-ui, sans-serif; font-size: 10px; font-weight: 700; color: #001430; letter-spacing: 0.06em; text-transform: uppercase; }
  .blanco { color: #999; }
  .btn-imprimir {
    display: block; width: 21.59cm; max-width: 100%; margin: 0 auto;
    padding: 10px; border: none; border-radius: 8px; background: #001430; color: #fff;
    font-family: system-ui, sans-serif; font-size: 13px; font-weight: 600; cursor: pointer;
  }
  /* El SVG del QR trae su propio width/height fijos en px (varían según cuántos
     módulos tenga, que depende del largo del token) — sin esto se sale del
     contenedor en vez de ajustarse a él. Mismo patrón que tirillaCapital.js. */
  .qr-letra svg { width: 56px; height: 56px; }
  @media print {
    body { background: #fff; padding: 0; gap: 0; }
    .hoja { box-shadow: none; page-break-after: always; }
    .hoja:last-child { page-break-after: auto; }
    .btn-imprimir { display: none; }
  }
  @page { size: 21.59cm 13.97cm; margin: 0; }
`

function hojaLetraCambio(letra) {
  const {
    tenantNombre, fecha, deudorNombre, deudorCedula,
    incluyeValor, valor, valorEnLetras,
    incluyeBeneficiario, beneficiario,
    incluyeFecha, fechaVencimiento,
    qrSvg,
  } = letra

  return `
    <div class="hoja">
      <span class="marca">${escaparHtml(tenantNombre)}</span>

      <div style="text-align:center; margin-bottom: 14px;">
        <p style="font-size: 20px; font-weight: 700; letter-spacing: 0.08em; margin: 0;">LETRA DE CAMBIO</p>
        <p style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; margin: 2px 0 0; color: #ba1a1a;">SIN PROTESTO</p>
      </div>

      <div style="display:flex; justify-content:space-between; font-size: 11.5px; margin-bottom: 10px;">
        <span>Lugar de creación: <span class="blanco">_______________________</span></span>
        <span>Fecha de creación: ${escaparHtml(formatearFechaHora(fecha))}</span>
      </div>

      <p style="font-size: 13.5px; line-height: 1.7; text-align: justify; margin: 0 0 10px;">
        Páguese incondicionalmente por esta ÚNICA letra de cambio, sin protesto, a la orden de
        <strong>${lineaOValor(incluyeBeneficiario ? beneficiario : null)}</strong>,
        la suma de <strong>${incluyeValor ? escaparHtml(formatearPrecio(valor)) : '<span class="blanco">_______________________</span>'}</strong>
        ${incluyeValor ? `(<em>${escaparHtml(valorEnLetras)}</em>)` : ''},
        valor que recibí a satisfacción del beneficiario arriba indicado.
      </p>

      <div style="display:flex; justify-content:space-between; font-size: 11.5px; margin-bottom: 14px;">
        <span>Vence: ${incluyeFecha ? escaparHtml(formatearFechaLocal(fechaVencimiento)) : '<span class="blanco">_______________________</span>'}</span>
        <span>Lugar de pago: <span class="blanco">_______________________</span></span>
      </div>

      <div style="border: 1px solid #ccc; border-radius: 8px; padding: 10px 14px; margin-bottom: 18px;">
        <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #666; margin: 0 0 3px;">Deudor (girado y aceptante)</p>
        <p style="font-size: 14px; font-weight: 700; margin: 0;">${escaparHtml(deudorNombre)}</p>
        <p style="font-size: 12px; margin: 2px 0 0;">C.C. ${escaparHtml(deudorCedula)}</p>
      </div>

      <div style="display:flex; align-items:flex-end; justify-content:space-between;">
        <div style="width: 60%;">
          <div style="border-top: 1px solid #111; padding-top: 4px;">
            <p style="font-size: 10.5px; margin: 0;">Firma del deudor (girador y aceptante)</p>
            <p style="font-size: 10.5px; margin: 0; color: #666;">C.C. ${escaparHtml(deudorCedula)}</p>
          </div>
        </div>
        ${qrSvg ? `
        <div style="text-align:center;">
          <div class="qr-letra">${qrSvg}</div>
          <p style="font-size: 8.5px; color: #666; margin: 2px 0 0;">Verificar documento</p>
        </div>` : ''}
      </div>
    </div>
  `
}

function hojaCartaInstrucciones(carta) {
  const { tenantNombre, fecha, deudorNombre, deudorCedula, camposEnBlanco } = carta

  const listaCampos = camposEnBlanco.map(c => `<li>${escaparHtml(c)}</li>`).join('')

  return `
    <div class="hoja">
      <span class="marca">${escaparHtml(tenantNombre)}</span>

      <p style="text-align:center; font-size: 16px; font-weight: 700; letter-spacing: 0.04em; margin: 0 0 14px;">CARTA DE INSTRUCCIONES</p>

      <p style="font-size: 12px; text-align: right; margin: 0 0 12px;">Fecha: ${escaparHtml(formatearFechaHora(fecha))}</p>

      <p style="font-size: 12.5px; line-height: 1.7; text-align: justify; margin: 0 0 10px;">
        Yo, <strong>${escaparHtml(deudorNombre)}</strong>, identificado(a) con cédula de ciudadanía
        No. <strong>${escaparHtml(deudorCedula)}</strong>, en calidad de girador y aceptante de la letra
        de cambio suscrita en la fecha arriba indicada a favor de <strong>${escaparHtml(tenantNombre)}</strong>,
        autorizo expresamente y de manera voluntaria a que dicha letra de cambio, entregada con los
        siguientes espacios en blanco, sea diligenciada por el acreedor arriba mencionado
        <strong>únicamente en caso de incumplimiento de mi obligación de pago</strong> en los términos
        pactados en el contrato de crédito correspondiente, y de conformidad con el artículo 622 del
        Código de Comercio:
      </p>

      <ul style="font-size: 12.5px; line-height: 1.6; margin: 0 0 16px;">
        ${listaCampos}
      </ul>

      <p style="font-size: 12.5px; line-height: 1.7; text-align: justify; margin: 0 0 24px;">
        Esta autorización se limita estrictamente a los campos aquí listados y en ningún caso habilita
        el diligenciamiento de datos distintos a los pactados.
      </p>

      <div style="width: 60%; border-top: 1px solid #111; padding-top: 4px;">
        <p style="font-size: 10.5px; margin: 0;">Firma del deudor</p>
        <p style="font-size: 10.5px; margin: 0; color: #666;">C.C. ${escaparHtml(deudorCedula)}</p>
      </div>
    </div>
  `
}

// Escribe la letra de cambio (y, si aplica, la carta de instrucciones como
// segunda hoja) en una pestaña ya abierta con abrirVentanaImprimible(). Si la
// pestaña no se pudo abrir (bloqueada por el navegador), no hace nada.
export function escribirDocumentoLetraCambio(ventana, { letra, cartaInstrucciones }) {
  if (!ventana) return

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Letra de cambio</title>
<style>${ESTILOS_BASE}</style>
</head>
<body>
  ${hojaLetraCambio(letra)}
  ${cartaInstrucciones ? hojaCartaInstrucciones(cartaInstrucciones) : ''}
  <button class="btn-imprimir" onclick="window.print()">Imprimir / Guardar como PDF</button>
</body>
</html>`

  ventana.document.open()
  ventana.document.write(html)
  ventana.document.close()
}
