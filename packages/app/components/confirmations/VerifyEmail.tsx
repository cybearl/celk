import { Button } from "@app/components/ui/Button"
import { Field, FieldLabel } from "@app/components/ui/Field"
import { Input } from "@app/components/ui/Input"
import GENERAL_CONFIG from "@app/config/general"
import { authClient } from "@app/lib/client/connectors/auth-client"
import { useCallback, useEffect, useState } from "react"

type VerifyEmailConfirmationProps = {
    email: string
    onClose: () => void
}

export default function VerifyEmailConfirmation({ email, onClose }: VerifyEmailConfirmationProps) {
    const [emailValue, setEmailValue] = useState(email)
    const [cooldown, setCooldown] = useState(GENERAL_CONFIG.emailResendCooldown)
    const [isResending, setIsResending] = useState(false)

    useEffect(() => {
        if (cooldown <= 0) return
        const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
        return () => clearTimeout(timer)
    }, [cooldown])

    /**
     * Resend the verification email.
     */
    const handleResend = useCallback(async () => {
        if (cooldown > 0 || isResending || !emailValue) return

        setIsResending(true)

        await authClient.sendVerificationEmail({ email: emailValue, callbackURL: "/" })

        setIsResending(false)
        setCooldown(GENERAL_CONFIG.emailResendCooldown)
    }, [cooldown, isResending, emailValue])

    return (
        <div className="flex flex-col justify-center items-center gap-3">
            {email ? (
                <p>
                    A verification email has been sent to {email}. Please check your inbox and click the link to
                    activate your account.
                </p>
            ) : (
                <>
                    <p>
                        Your email address has not been verified yet. Enter your email below to receive a new
                        verification link.
                    </p>
                    <Field className="w-full">
                        <FieldLabel htmlFor="verify-email-input">Email</FieldLabel>
                        <Input
                            id="verify-email-input"
                            type="email"
                            autoComplete="email"
                            placeholder="john.doe@example.com"
                            value={emailValue}
                            onChange={e => setEmailValue(e.target.value)}
                        />
                    </Field>
                </>
            )}

            <p className="text-muted-foreground text-sm">
                If you haven't received the email, check your spam folder or click "Resend Email" to try again.
            </p>

            <div className="flex gap-2 ml-auto mt-1">
                <Button
                    variant="outline"
                    onClick={handleResend}
                    isLoading={isResending}
                    disabled={cooldown > 0 || isResending || !emailValue}
                >
                    {cooldown > 0 ? `Resend Email (${cooldown}s)` : "Resend Email"}
                </Button>

                <Button onClick={onClose}>Close</Button>
            </div>
        </div>
    )
}
