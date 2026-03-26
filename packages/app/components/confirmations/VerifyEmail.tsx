import { Button } from "@app/components/ui/Button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@app/components/ui/Field"
import { Input } from "@app/components/ui/Input"
import GENERAL_CONFIG from "@app/config/general"
import { authClient } from "@app/lib/client/connectors/authClient"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback, useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import z from "zod"

const verifyEmailFormSchema = z.object({
    email: z.email("Invalid email address"),
})

type VerifyEmailForm = z.infer<typeof verifyEmailFormSchema>

type VerifyEmailConfirmationProps = {
    email: string | null
    onClose: () => void
}

export default function VerifyEmailConfirmation({ email, onClose }: VerifyEmailConfirmationProps) {
    const [cooldown, setCooldown] = useState(email ? GENERAL_CONFIG.emailResendCooldown : 0)

    const form = useForm<VerifyEmailForm>({
        defaultValues: {
            email: email ?? "",
        },
        resolver: zodResolver(verifyEmailFormSchema),
    })

    // Decrease cooldown timer every second if it's greater than 0
    useEffect(() => {
        if (cooldown <= 0) return
        const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
        return () => clearTimeout(timer)
    }, [cooldown])

    /**
     * Resend the verification email.
     * @param data The form data containing the email address to which to resend the verification email.
     */
    const handleSubmit = useCallback(
        async (data: VerifyEmailForm) => {
            if (cooldown > 0) return

            await authClient.sendVerificationEmail({
                email: data.email,
                callbackURL: `${window.location.origin}/?email-verified=true`,
            })

            setCooldown(GENERAL_CONFIG.emailResendCooldown)
        },
        [cooldown],
    )

    return (
        <form className="flex flex-col justify-center items-center gap-3" onSubmit={form.handleSubmit(handleSubmit)}>
            {email ? (
                <p>
                    An email has been sent to {email}.
                    <br />
                    Please check your inbox and click the link to activate your account.
                </p>
            ) : (
                <>
                    <p>
                        Your email address has not been verified yet. Enter your email below to receive a new
                        verification link.
                    </p>
                    <FieldGroup className="w-full">
                        <Controller
                            control={form.control}
                            name="email"
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                                    <Input
                                        type="email"
                                        autoComplete="email"
                                        aria-invalid={fieldState.invalid}
                                        id={field.name}
                                        placeholder="john.doe@example.com"
                                        {...field}
                                    />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                                </Field>
                            )}
                        />
                    </FieldGroup>
                </>
            )}

            <p className="text-muted-foreground text-sm">
                If you haven't received the email, check your spam folder or click "Resend Email" to try again.
            </p>

            <div className="flex gap-2 ml-auto mt-1">
                <Button type="submit" variant="outline" isLoading={form.formState.isSubmitting} disabled={cooldown > 0}>
                    {cooldown > 0 ? `Resend Email (${cooldown}s)` : "Resend Email"}
                </Button>

                <Button type="button" onClick={onClose}>
                    Close
                </Button>
            </div>
        </form>
    )
}
