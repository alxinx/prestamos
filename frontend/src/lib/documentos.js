const EXTENSIONES_IMAGEN = ['jpg', 'jpeg', 'png', 'webp']
const EXTENSIONES_OFFICE = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
const EXTENSIONES_PDF = ['pdf']
export const EXTENSIONES_PERMITIDAS = [...EXTENSIONES_IMAGEN, ...EXTENSIONES_OFFICE, ...EXTENSIONES_PDF]
export const ACCEPT_DOCUMENTOS = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp'

const MAX_IMAGEN_BYTES = 3 * 1024 * 1024

function extensionDe(nombreArchivo) {
  const partes = nombreArchivo.split('.')
  return partes.length > 1 ? partes.pop().toLowerCase() : ''
}

// Validación de cortesía en el cliente — el backend vuelve a validar todo
// (incluyendo la firma binaria del archivo) antes de persistir nada.
export function validarArchivoDocumento(archivo) {
  const extension = extensionDe(archivo.name)
  if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
    return 'Solo se permiten documentos PDF, Office (Word/Excel/PowerPoint) o imágenes.'
  }
  if (EXTENSIONES_IMAGEN.includes(extension) && archivo.size > MAX_IMAGEN_BYTES) {
    return 'Las imágenes no pueden superar 3 MB.'
  }
  return null
}

export function formatearTamanoArchivo(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
