const nodemailer = require('nodemailer')

const sendMailgun = async (options) => {
    let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD,
        },
      })
    const message = {
      from: `${process.env.FROM_NAME}<${process.env.FROM_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
    }
  await transporter.sendMail(message)
  
  }
  module.exports = sendMailgun
