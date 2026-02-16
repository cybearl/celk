import { PRIVATE_ENV } from "@app/config/env"
import { createTransport, type Transporter } from "nodemailer"

// Using a global variable to prevent multiple instances of the SMTP transporter
let globalSmtpTransporter: Transporter | undefined

/**
 * The SMTP transporter for sending emails, either from the global variable
 * or a new instance.
 */
const smtpTransporter =
    globalSmtpTransporter ??
    createTransport({
        host: PRIVATE_ENV.smtp.host,
        port: PRIVATE_ENV.smtp.port,
        secure: true,
        auth: {
            user: PRIVATE_ENV.smtp.user,
            pass: PRIVATE_ENV.smtp.password,
        },
    })

if (process.env.NODE_ENV !== "production") globalSmtpTransporter = smtpTransporter

export default smtpTransporter
