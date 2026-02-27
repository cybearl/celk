import { Field, FieldError, FieldGroup, FieldLabel } from "@app/components/ui/Field"
import { Input } from "@app/components/ui/Input"
import { authClient } from "@app/lib/client/connectors/auth-client"
import { CyCONSTANTS } from "@cybearl/cypack"
import { zodResolver } from "@hookform/resolvers/zod"
import { type ReactNode, useCallback, useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import z from "zod"

const resetPasswordFormSchema = z
    .object({
        password: z
            .string()
            .min(
                CyCONSTANTS.MIN_PASSWORD_LENGTH,
                `Password must be at least ${CyCONSTANTS.MIN_PASSWORD_LENGTH} characters`,
            )
            .max(
                CyCONSTANTS.MAX_PASSWORD_LENGTH,
                `Password must be at most ${CyCONSTANTS.MAX_PASSWORD_LENGTH} characters`,
            ),
        confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine(data => data.password === data.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords do not match",
    })

type ResetPasswordForm = z.infer<typeof resetPasswordFormSchema>

type ResetPasswordFormProps = {
    trigger: (isSubmitting: boolean) => ReactNode
    token?: string | null
    onSuccess?: () => void
}

export default function ResetPasswordForm({ trigger, token, onSuccess }: ResetPasswordFormProps) {
    const form = useForm<ResetPasswordForm>({
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
        resolver: zodResolver(resetPasswordFormSchema),
    })

    useEffect(() => {
        if (!token) form.setError("root", { message: "No token provided" })
    }, [token, form])

    const handleSubmit = useCallback(
        async (data: ResetPasswordForm) => {
            if (!token) {
                form.setError("root", {
                    message: "No reset token provided",
                })

                return
            }

            const { error } = await authClient.resetPassword({
                newPassword: data.password,
                token,
            })

            if (error) {
                form.setError("root", {
                    message: error.message,
                })
            } else {
                onSuccess?.()
            }
        },
        [form, token, onSuccess],
    )

    return (
        <form className="space-y-4 w-full" onSubmit={form.handleSubmit(handleSubmit)}>
            <FieldGroup>
                <Controller
                    control={form.control}
                    name="password"
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>New password</FieldLabel>
                            <Input
                                type="password"
                                autoComplete="new-password"
                                aria-invalid={fieldState.invalid}
                                id={field.name}
                                placeholder="New password"
                                {...field}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                        </Field>
                    )}
                />

                <Controller
                    control={form.control}
                    name="confirmPassword"
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Confirm new password</FieldLabel>
                            <Input
                                type="password"
                                autoComplete="new-password"
                                aria-invalid={fieldState.invalid}
                                id={field.name}
                                placeholder="Confirm new password"
                                {...field}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                        </Field>
                    )}
                />

                {form.formState.errors.root && <FieldError errors={[form.formState.errors.root]} />}
            </FieldGroup>

            {trigger(form.formState.isSubmitting)}
        </form>
    )
}
