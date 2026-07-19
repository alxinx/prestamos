'use strict'

const nodemailer = require('nodemailer')

const transporte = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
})

async function enviarEmail({ destinatario, asunto, html, attachments }) {
  await transporte.sendMail({
    from: `"${process.env.MAIL_FROM_NAME || 'GotaPay'}" <${process.env.MAIL_FROM_ADDRESS}>`,
    to: destinatario,
    subject: asunto,
    html,
    attachments,
  })
}

module.exports = { enviarEmail }
