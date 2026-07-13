'use strict'

const sharp = require('sharp')
const { v7: uuidv7 } = require('uuid')
const prisma = require('./prisma')
const { subirArchivoR2 } = require('./r2Client')

const MAX_IMAGEN_BYTES = 3 * 1024 * 1024
const MAX_DOCUMENTO_MB = Number(process.env.MAX_FILE_SIZE_MB) || 10
const MAX_DOCUMENTO_BYTES = MAX_DOCUMENTO_MB * 1024 * 1024
const ANCHO_MAXIMO_IMAGEN = 800
const CALIDAD_WEBP = 82

const EXTENSIONES_IMAGEN = ['jpg', 'jpeg', 'png', 'webp']
const EXTENSIONES_OFFICE = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
const EXTENSIONES_PDF = ['pdf']
const EXTENSIONES_PERMITIDAS = [...EXTENSIONES_IMAGEN, ...EXTENSIONES_OFFICE, ...EXTENSIONES_PDF]

const FIRMA_PDF = Buffer.from('%PDF', 'latin1')
const FIRMA_ZIP_OFFICE = Buffer.from([0x50, 0x4b, 0x03, 0x04])
const FIRMA_OLE_OFFICE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])

function extensionDe(nombreArchivo) {
  const partes = String(nombreArchivo).split('.')
  return partes.length > 1 ? partes.pop().toLowerCase() : ''
}

// Verifica los primeros bytes del archivo contra la firma binaria esperada para su
// extensión — evita que un archivo renombrado (ej. .exe -> .pdf) pase la validación.
function firmaBinariaValida(buffer, extension) {
  if (extension === 'pdf') return buffer.subarray(0, 4).equals(FIRMA_PDF)
  if (['docx', 'xlsx', 'pptx'].includes(extension)) return buffer.subarray(0, 4).equals(FIRMA_ZIP_OFFICE)
  if (['doc', 'xls', 'ppt'].includes(extension)) return buffer.subarray(0, 8).equals(FIRMA_OLE_OFFICE)
  return true // las imágenes se validan con sharp (decodifica el contenido real)
}

class ErrorDocumento extends Error {}

// Carpeta plural en minúsculas por tipo de entidad — CLAUDE.md §9: ruta obligatoria
// {tenantId}/{entidad}/{entidadId}/{documentoId}.{ext}.
const CARPETA_POR_ENTIDAD = {
  EMPLEADO: 'empleados',
  CLIENTE: 'clientes',
  CREDITO: 'creditos',
  ENTIDAD: 'entidad',
}

// Valida, procesa (resize + conversión a webp si es imagen) y sube un documento a R2,
// devolviendo el registro de Documento creado. Lanza ErrorDocumento con mensaje apto
// para mostrar al usuario si el archivo no pasa alguna validación. Genérico por
// entidadTipo (TipoEntidadDocumento) — usado por colaboradores y clientes, entre
// otros módulos que necesiten adjuntar archivos.
async function subirDocumento({ tenantId, entidadTipo, entidadId, subidoPorId, nombreArchivo, archivo }) {
  const extensionOriginal = extensionDe(archivo.originalname)

  if (!EXTENSIONES_PERMITIDAS.includes(extensionOriginal)) {
    throw new ErrorDocumento('Tipo de archivo no permitido. Solo se aceptan PDF, Office (Word/Excel/PowerPoint) o imágenes (jpg, png, webp).')
  }

  const esImagen = EXTENSIONES_IMAGEN.includes(extensionOriginal)

  if (esImagen && archivo.size > MAX_IMAGEN_BYTES) {
    throw new ErrorDocumento('Las imágenes no pueden superar 3 MB.')
  }
  if (!esImagen && archivo.size > MAX_DOCUMENTO_BYTES) {
    throw new ErrorDocumento(`El archivo no puede superar ${MAX_DOCUMENTO_MB} MB.`)
  }

  if (!firmaBinariaValida(archivo.buffer, extensionOriginal)) {
    throw new ErrorDocumento('El contenido del archivo no coincide con su extensión.')
  }

  let bufferFinal = archivo.buffer
  let extensionFinal = extensionOriginal
  let contentType = archivo.mimetype

  if (esImagen) {
    const metadatos = await sharp(archivo.buffer).metadata().catch(() => null)
    if (!metadatos || !['jpeg', 'png', 'webp'].includes(metadatos.format)) {
      throw new ErrorDocumento('El archivo no es una imagen válida.')
    }
    bufferFinal = await sharp(archivo.buffer)
      .resize({ width: ANCHO_MAXIMO_IMAGEN, withoutEnlargement: true })
      .webp({ quality: CALIDAD_WEBP })
      .toBuffer()
    extensionFinal = 'webp'
    contentType = 'image/webp'
  }

  const documentoId = uuidv7()
  const carpeta = CARPETA_POR_ENTIDAD[entidadTipo] ?? 'entidad'
  const ruta = `${tenantId}/${carpeta}/${entidadId}/${documentoId}.${extensionFinal}`

  await subirArchivoR2(bufferFinal, ruta, contentType)

  const documento = await prisma.documento.create({
    data: {
      id: documentoId,
      tenantId,
      entidadTipo,
      entidadId,
      tipoDocumento: 'OTRO',
      nombreArchivo,
      url: ruta,
      tamanioBytes: bufferFinal.length,
      subidoPorId,
    },
    select: { id: true, nombreArchivo: true, tamanioBytes: true, createdAt: true },
  })

  return { ...documento, extension: extensionFinal }
}

module.exports = { subirDocumento, ErrorDocumento, extensionDe, EXTENSIONES_PERMITIDAS, EXTENSIONES_IMAGEN, MAX_IMAGEN_BYTES, MAX_DOCUMENTO_BYTES }
