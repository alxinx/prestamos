'use strict'

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')

const cliente = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

async function subirArchivoR2(buffer, ruta, contentType) {
  await cliente.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: ruta,
    Body: buffer,
    ContentType: contentType,
  }))
}

module.exports = { subirArchivoR2 }
