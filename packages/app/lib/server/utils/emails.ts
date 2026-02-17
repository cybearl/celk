import smtpTransporter from "@app/lib/server/connectors/smtp"
import type { User } from "better-auth"

/**
 * Sends an email verification link to a user via the SMTP transport.
 * @param user The user to send the email to.
 * @param url The email verification link.
 */
// biome-ignore lint/suspicious/useAwait: Prevent timing attacks by not awaiting email sending
export async function sendVerificationEmail({ user, url }: { user: User; url: string }) {
    // Simply text email for now just to test
    const mailOptions = {
        from: "noreply@cybearl.com",
        to: user.email,
        subject: "Email Verification",
        text: `Please verify your email by clicking on the following link: ${url}`,
    }

    smtpTransporter.sendMail(mailOptions)
}

/**
 * Sends a password reset link to a user via the SMTP transport.
 */
// biome-ignore lint/suspicious/useAwait: Prevent timing attacks by not awaiting email sending
export async function sendPasswordResetEmail({ user, url }: { user: User; url: string }) {
    // Simply text email for now just to test
    const mailOptions = {
        from: "noreply@cybearl.com",
        to: user.email,
        subject: "Password Reset",
        text: `Please reset your password by clicking on the following link: ${url}`,
    }

    smtpTransporter.sendMail(mailOptions)
}
