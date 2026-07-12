// Iniciales + color de avatar DRY — usados en cualquier listado con "burbujas" de
// persona (clientes a visitar, socios, colaboradores) para no repetir la lógica.
export function inicialesDe(nombre) {
  return nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

const CLASES_AVATAR = [
  'bg-secondary/15 text-secondary',
  'bg-primary/10 text-primary',
  'bg-tertiary-container/25 text-on-tertiary-container',
  'bg-error-container text-on-error-container',
]

export function claseAvatar(indice) {
  return CLASES_AVATAR[indice % CLASES_AVATAR.length]
}
