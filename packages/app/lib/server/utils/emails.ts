import { PRIVATE_ENV } from "@app/config/env"
import { numericStringToFormatted } from "@app/lib/base/utils/numerics"
import smtpTransporter from "@app/lib/server/connectors/smtp"
import type { User } from "better-auth"
import dedent from "dedent"

/**
 * Send an email verification link to a user via the SMTP transport.
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
 * Send a balance checker failure alert to the default admin when the balance checker has exceeded the retry limit.
 * @param retries The number of consecutive balance checker failures so far.
 * @param error The last error that caused the check to fail.
 */
// biome-ignore lint/suspicious/useAwait: Prevent timing attacks by not awaiting email sending
export async function sendBalanceCheckerFailureAlert(retries: number, error: unknown) {
    const mailOptions = {
        from: "noreply@cybearl.com",
        to: PRIVATE_ENV.defaultAdmin.email,
        subject: "Balance Checker Failure Alert",
        text: dedent`The balance checker has failed ${retries.toLocaleString("en-US")} consecutive time(s)
                     and has exceeded the configured retry limit.\n\n
                     Last error:\n${error instanceof Error ? (error.stack ?? error.message) : String(error)}
        `,
    }

    smtpTransporter.sendMail(mailOptions)
}

/**
 * Send a workers manager sync failure alert to the default admin when the worker sync has exceeded the retry limit.
 * @param retries The number of consecutive sync failures so far.
 * @param error The last error that caused the sync to fail.
 */
// biome-ignore lint/suspicious/useAwait: Prevent timing attacks by not awaiting email sending
export async function sendWorkersManagerSyncFailureAlert(retries: number, error: unknown) {
    const mailOptions = {
        from: "noreply@cybearl.com",
        to: PRIVATE_ENV.defaultAdmin.email,
        subject: "Worker Sync Failure Alert",
        text: dedent`The worker sync has failed ${retries.toLocaleString("en-US")} consecutive time(s)
                     and has exceeded the configured retry limit.\n\n
                     Last error:\n${error instanceof Error ? (error.stack ?? error.message) : String(error)}
        `,
    }

    smtpTransporter.sendMail(mailOptions)
}

/**
 * Send a password reset link to a user via the SMTP transport.
 * @param user The user to send the email to.
 * @param url The password reset link.
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

/**
 * Send a match alert email to the user.
 * @param user The user to send the email to.
 * @param addressListName The name of the address list where the match was found.
 * @param address The address that was matched.
 * @param attempts The number of **total** attempts made by the worker before the match was found.
 */
// biome-ignore lint/suspicious/useAwait: Prevent timing attacks by not awaiting email sending
export async function sendMatchAlert({
    user,
    addressListName,
    address,
    totalAttempts,
}: {
    user: { email: string; name: string }
    addressListName: string
    address: string
    totalAttempts: string
}) {
    const mailOptions = {
        from: "noreply@cybearl.com",
        to: user.email,
        subject: "Match Found!",
        text: dedent`A match has been found in address list "${addressListName}".
                     Address: ${address}
                     Total attempts at time of match: ${numericStringToFormatted(totalAttempts)}

                     The encrypted private key has been saved to the database.
                     A local trace has also been preserved in the matches directory.
        `,
    }

    smtpTransporter.sendMail(mailOptions)
}
