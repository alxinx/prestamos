import { IcoOjo, IcoOjoTachado } from '../iconos'
import { useMostrarContrasena } from '../../hooks/useMostrarContrasena'

/** Input de contraseña reutilizable para las páginas auth del tenant */
export default function CampoPassword({ id, label, valor, onChange, placeholder, autoComplete = 'current-password' }) {
  const [visible, alternarVisible] = useMostrarContrasena()

  return (
    <div>
      {label && (
        <label htmlFor={id} style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={valor}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••••••'}
          autoComplete={autoComplete}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '13px 46px 13px 16px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, color: '#ffffff', fontSize: 14,
            fontFamily: "'Hanken Grotesk', sans-serif", outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = 'rgba(86,251,171,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(86,251,171,0.08)' }}
          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
        />
        <button
          type="button"
          onClick={alternarVisible}
          tabIndex={-1}
          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex', padding: 4 }}
        >
          {visible ? <IcoOjoTachado /> : <IcoOjo />}
        </button>
      </div>
    </div>
  )
}
