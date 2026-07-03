import { useState, useEffect, useRef } from 'react'

function formatear(numero) {
  if (numero === null || numero === undefined || numero === '') return ''
  const n = typeof numero === 'string' ? parseFloat(numero) : numero
  if (isNaN(n)) return ''
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n)
}

function parsear(texto) {
  const limpio = texto.replace(/\./g, '').trim()
  const n = parseInt(limpio, 10)
  return isNaN(n) ? 0 : n
}

/**
 * Input para valores monetarios en COP.
 * Props:
 *   valor        – número actual
 *   onChange     – recibe el número parseado sin formato
 *   prefijo      – símbolo antes del input (default "$")
 *   className    – clases del <input>
 *   style        – estilos extra del <input> (compatibilidad hacia atrás)
 */
export default function InputMoneda({ valor, onChange, prefijo = '$', className = '', style = {}, ...resto }) {
  const [display, setDisplay] = useState(() => formatear(valor))
  const refInput = useRef(null)

  useEffect(() => {
    setDisplay(formatear(valor))
  }, [valor])

  function manejarCambio(e) {
    const input = e.target
    const posicionCursor = input.selectionEnd
    const textoNuevo = input.value

    const digitosAntesCursor = textoNuevo.slice(0, posicionCursor).replace(/[^0-9]/g, '').length
    const soloDigitos = textoNuevo.replace(/[^0-9]/g, '')

    if (!soloDigitos) {
      setDisplay('')
      onChange(0)
      return
    }

    const numero = parseInt(soloDigitos, 10)
    const formateado = formatear(numero)

    setDisplay(formateado)
    onChange(numero)

    requestAnimationFrame(() => {
      if (!refInput.current) return
      let pos = 0
      let conteo = 0
      for (let i = 0; i < formateado.length; i++) {
        if (/[0-9]/.test(formateado[i])) conteo++
        if (conteo === digitosAntesCursor) { pos = i + 1; break }
      }
      refInput.current.setSelectionRange(pos, pos)
    })
  }

  return (
    <div className="relative">
      {prefijo && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none select-none" style={{ fontSize: '0.75em' }}>
          {prefijo}
        </span>
      )}
      <input
        ref={refInput}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={manejarCambio}
        {...resto}
        className={className}
        style={{
          ...style,
          paddingLeft: prefijo ? '24px' : (style.paddingLeft ?? '12px'),
        }}
      />
    </div>
  )
}
