'use strict'

const crypto = require('crypto')
const bcrypt = require('bcrypt')
const prisma = require('../../lib/prisma')
const { redis } = require('../../lib/redis')
const { enviarEmail } = require('../../lib/email')
const { emailRecuperacionContrasena } = require('../../emails/recuperacionContrasena')
const { HASH_FICTICIO, crearControlIntentos, emitirTokens, rotarRefreshToken, cerrarSesionComun } = require('../../lib/sesion')

const COOKIE_REFRESH  = 't_refresh'
const PREFIJO = 'tenant'

const MAX_INTENTOS    = Number(process.env.LOGIN_MAX_INTENTOS_EMAIL) || 5
const BLOQUEO_SEG     = Number(process.env.LOGIN_BLOQUEO_SEGUNDOS)   || 15 * 60

const ESTADOS_TENANT_PERMITIDOS = ['ACTIVO', 'PERIODO_GRACIA']

const { estaBloqueado, registrarFallo, resetearIntentos } =
  crearControlIntentos(PREFIJO, { maxIntentos: MAX_INTENTOS, bloqueoSegundos: BLOQUEO_SEG })

async function iniciarSesion(req) {
  const { email, password } = req.body

  if (await estaBloqueado(email)) {
    return { error: 'Demasiados intentos fallidos. Intente de nuevo más tarde.', status: 429 }
  }

  const empleado = await prisma.empleado.findFirst({
    where: { email: email.toLowerCase().trim(), estado: 'ACTIVO' },
    include: { rol: { select: { nombre: true } } },
  })

  // passwordHash es null mientras el colaborador no ha completado su activación por email
  const hashAComparar = empleado?.passwordHash || HASH_FICTICIO
  const contrasenaValida = await bcrypt.compare(password, hashAComparar)

  if (!empleado || !contrasenaValida) {
    await registrarFallo(email)
    return { error: 'Credenciales inválidas', status: 401 }
  }

  // Verificar que el tenant esté activo
  const tenant = await prisma.tenant.findUnique({
    where: { id: empleado.tenantId },
    select: { id: true, estado: true, nombreNegocio: true },
  })

  if (!tenant || !ESTADOS_TENANT_PERMITIDOS.includes(tenant.estado)) {
    return { error: 'Tu cuenta está suspendida. Contacta al administrador.', status: 403 }
  }

  await resetearIntentos(email)

  const { accessToken, refreshToken } = await emitirTokens({
    prefijo: PREFIJO,
    carga: {
      sub:          empleado.id,
      tenantId:     empleado.tenantId,
      role:         empleado.rol.nombre,
      esSuperAdmin: empleado.esSuperAdmin,
    },
    idSujeto: empleado.id,
  })

  prisma.empleado
    .update({ where: { id: empleado.id }, data: { updatedAt: new Date() } })
    .catch(() => {})

  return { accessToken, refreshToken, nombreCookie: COOKIE_REFRESH }
}

async function renovarToken(req) {
  const resultado = await rotarRefreshToken({
    req,
    cookieNombre: COOKIE_REFRESH,
    prefijo: PREFIJO,
    construirCarga: carga => ({ sub: carga.sub, tenantId: carga.tenantId, role: carga.role, esSuperAdmin: carga.esSuperAdmin }),
    // Si el colaborador fue desactivado mientras su sesión seguía viva, no se le
    // renueva el access token — el aviso en tiempo real ya lo saca del panel, pero
    // esto cierra la ventana de un refresh token (hasta 7 días) que quedaría vivo.
    validarSujeto: async empleadoId => {
      const empleado = await prisma.empleado.findFirst({ where: { id: empleadoId, estado: 'ACTIVO' }, select: { id: true } })
      return !!empleado
    },
  })
  if (resultado.error) return resultado
  return { ...resultado, nombreCookie: COOKIE_REFRESH }
}

async function cerrarSesion(req) {
  await cerrarSesionComun({ req, cookieNombre: COOKIE_REFRESH, prefijo: PREFIJO })
  return { nombreCookie: COOKIE_REFRESH }
}

const RESET_TTL_SEG = 60 * 60 // 1 hora

function claveReset(token) {
  return `tenant:reset:${token}`
}

async function solicitarRecuperacion({ email }) {
  const empleado = await prisma.empleado.findFirst({
    where: { email: email.toLowerCase().trim(), estado: 'ACTIVO' },
  })

  // Siempre la misma respuesta — no revelar si el email existe
  if (!empleado) return { ok: true }

  const token = crypto.randomBytes(32).toString('hex')
  await redis.set(claveReset(token), empleado.id, 'EX', RESET_TTL_SEG)

  const urlReset = `${process.env.APP_URL}/restablecer-contrasena?token=${token}`
  const html = emailRecuperacionContrasena({ nombreCompleto: empleado.nombreCompleto, urlReset })

  enviarEmail({ destinatario: empleado.email, asunto: 'Recupera tu contraseña — GotaPay', html })
    .catch(err => console.error('[Email] Error recuperación:', err.message))

  return { ok: true }
}

async function restablecerContrasena({ token, password }) {
  const empleadoId = await redis.get(claveReset(token))
  if (!empleadoId) return { error: 'El enlace expiró o ya fue utilizado.', status: 400 }

  const nuevoHash = await bcrypt.hash(password, 12)

  await prisma.empleado.update({
    where: { id: empleadoId },
    data:  { passwordHash: nuevoHash },
  })

  await redis.del(claveReset(token))

  return { ok: true }
}

async function obtenerPerfil(req) {
  const { id: empleadoId, tenantId } = req.empleado

  const [empleado, tenant] = await Promise.all([
    prisma.empleado.findFirst({
      where: { id: empleadoId, tenantId },
      select: {
        id:            true,
        nombreCompleto: true,
        email:         true,
        esSuperAdmin:  true,
        rol:           { select: { nombre: true } },
      },
    }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { nombreNegocio: true } }),
  ])

  if (!empleado) return { error: 'Empleado no encontrado', status: 404 }

  return {
    id:             empleado.id,
    nombreCompleto: empleado.nombreCompleto,
    email:          empleado.email,
    rol:            empleado.rol.nombre,
    esSuperAdmin:   empleado.esSuperAdmin,
    nombreNegocio:  tenant?.nombreNegocio ?? '',
  }
}

module.exports = { iniciarSesion, renovarToken, cerrarSesion, solicitarRecuperacion, restablecerContrasena, obtenerPerfil }
