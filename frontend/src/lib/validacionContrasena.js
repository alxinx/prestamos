// Reglas mínimas de contraseña compartidas por Activar, RestablecerContrasena y
// ModalConfigUsuario (antes reimplementadas por separado en cada archivo).
export function reglasContrasena(password) {
  return [
    { texto: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { texto: 'Al menos una mayúscula', ok: /[A-Z]/.test(password) },
    { texto: 'Al menos un número', ok: /[0-9]/.test(password) },
  ]
}

export function contrasenaEsValida(password) {
  return reglasContrasena(password).every(r => r.ok)
}
