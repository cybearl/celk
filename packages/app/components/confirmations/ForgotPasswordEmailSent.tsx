import { Button } from "@app/components/ui/Button"
import GENERAL_CONFIG from "@app/config/general"
import { authClient } from "@app/lib/client/connectors/auth-client"
import { useCallback, useEffect, useState } from "react"

type ForgotPasswordEmailSentConfirmationProps = {
    email: string
    redirectTo: string
    onClose: () => void
}

export default function ForgotPasswordEmailSentConfirmation({
    email,
    redirectTo,
    onClose,
}: ForgotPasswordEmailSentConfirmationProps) {
    const [cooldown, setCooldown] = useState(GENERAL_CONFIG.emailResendCooldown)
    const [isResending, setIsResending] = useState(false)

    useEffect(() => {
        if (cooldown <= 0) return
        const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
        return () => clearTimeout(timer)
    }, [cooldown])

    const handleResend = useCallback(async () => {
        if (cooldown > 0 || isResending) return

        setIsResending(true)

        await authClient.requestPasswordReset({ email, redirectTo })

        setIsResending(false)
        setCooldown(GENERAL_CONFIG.emailResendCooldown)
    }, [cooldown, isResending, email, redirectTo])

    return (
        <div className="flex flex-col justify-center items-center gap-3">
            <p>
                If an account with this email exists, an email has been sent with instructions to reset your password.
            </p>
            <p className="text-muted-foreground text-sm">
                If you haven't received the email, check your spam folder or click "Resend Email" to try again.
            </p>

            <div className="flex gap-2 ml-auto mt-1">
                <Button
                    variant="outline"
                    onClick={handleResend}
                    isLoading={isResending}
                    disabled={cooldown > 0 || isResending}
                >
                    {cooldown > 0 ? `Resend Email (${cooldown}s)` : "Resend Email"}
                </Button>

                <Button onClick={onClose}>Close</Button>
            </div>
        </div>
    )
}
