'use strict'

const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

const cliente = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const URL_DESCARGA_EXPIRA_SEGUNDOS = 5 * 60

async function subirArchivoR2(buffer, ruta, contentType) {
  await cliente.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: ruta,
    Body: buffer,
    ContentType: contentType,
  }))
}

async function eliminarArchivoR2(ruta) {
  await cliente.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: ruta,
  }))
}

// URL temporal firmada — el cliente nunca recibe la ruta directa del bucket (CLAUDE.md §9).
async function generarUrlDescargaR2(ruta) {
  const comando = new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: ruta })
  return getSignedUrl(cliente, comando, { expiresIn: URL_DESCARGA_EXPIRA_SEGUNDOS })
}

module.exports = { subirArchivoR2, eliminarArchivoR2, generarUrlDescargaR2 }
