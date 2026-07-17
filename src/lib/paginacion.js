'use strict'

// Parseo/saneamiento DRY de query params de paginación — compartido entre todos
// los listados paginados del tenant (clientes, créditos, ...). Nunca confiar en
// pagina/porPagina tal como llegan del frontend (CLAUDE.md §6).
function parsearPaginacion({ pagina, porPagina }, { porPaginaDefault = 10, porPaginaMax = 50 } = {}) {
  const paginaNum = Math.max(1, parseInt(pagina, 10) || 1)
  const porPaginaNum = Math.min(porPaginaMax, Math.max(1, parseInt(porPagina, 10) || porPaginaDefault))
  return { paginaNum, porPaginaNum }
}

module.exports = { parsearPaginacion }
