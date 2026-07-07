'use strict'

const { v7: uuidv7 } = require('uuid')
const prisma = require('../../../lib/prisma')
const { CATALOGO_PERMISOS, PERMISOS_POR_ROL } = require('./permisos.catalogo')

const NOMBRES_ROLES_PREDEFINIDOS = ['ADMINISTRADOR', 'SECRETARIA', 'AUDITOR', 'COBRADOR']

// Siembra global del catálogo de permisos (no depende de tenant). Idempotente:
// si un código ya existe no se toca, para no pisar ediciones futuras.
async function sembrarCatalogoPermisos() {
  for (const permiso of CATALOGO_PERMISOS) {
    const existe = await prisma.permisoCatalogo.findUnique({ where: { codigo: permiso.codigo } })
    if (existe) continue
    await prisma.permisoCatalogo.create({ data: { id: uuidv7(), ...permiso } })
  }
}

// Crea (si faltan) los 4 roles predefinidos de un tenant y sus permisos base.
// Idempotente: solo crea lo que falta, nunca sobrescribe un RolPermiso existente
// (para no pisar ajustes que un administrador haya hecho desde el panel).
async function sembrarRolesYPermisosTenant(tenantId) {
  const roles = {}

  for (const nombre of NOMBRES_ROLES_PREDEFINIDOS) {
    let rol = await prisma.rol.findFirst({ where: { tenantId, nombre } })
    if (!rol) {
      rol = await prisma.rol.create({
        data: { id: uuidv7(), tenantId, nombre, esPredefinido: true },
      })
    }
    roles[nombre] = rol
  }

  const catalogo = await prisma.permisoCatalogo.findMany({ select: { id: true, codigo: true } })

  for (const [nombreRol, rol] of Object.entries(roles)) {
    const codigosActivos = new Set(PERMISOS_POR_ROL[nombreRol] || [])

    for (const permiso of catalogo) {
      const existente = await prisma.rolPermiso.findFirst({
        where: { tenantId, rolId: rol.id, permisoCatalogoId: permiso.id },
      })
      if (existente) continue

      await prisma.rolPermiso.create({
        data: {
          id: uuidv7(),
          tenantId,
          rolId: rol.id,
          permisoCatalogoId: permiso.id,
          activo: codigosActivos.has(permiso.codigo),
        },
      })
    }
  }

  return roles
}

module.exports = { sembrarCatalogoPermisos, sembrarRolesYPermisosTenant }
