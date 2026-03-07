import { Field, FieldError, FieldGroup, FieldLabel } from "@app/components/ui/Field"
import { Input } from "@app/components/ui/Input"
import { authClient } from "@app/lib/client/connectors/auth-client"
import { zodResolver } from "@hookform/resolvers/zod"
import { type ReactNode, useCallback } from "react"
import { Controller, useForm } from "react-hook-form"
import z from "zod"

const forgotPasswordFormSchema = z.object({
    email: z.email("Invalid email address."),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordFormSchema>

type ForgotPasswordFormProps = {
    trigger: (isSubmitting: boolean) => ReactNode
    onSuccess?: (email: string) => void
}

export default function ForgotPasswordForm({ trigger, onSuccess }: ForgotPasswordFormProps) {
    const form = useForm<ForgotPasswordFormData>({
        defaultValues: {
            email: "",
        },
        resolver: zodResolver(forgotPasswordFormSchema),
    })

    /**
     * Handles the submission of the forgot password form.
     * @param data The form data containing the email address for which to request a password reset.
     */
    const handleSubmit = useCallback(
        async (data: ForgotPasswordFormData) => {
            const { error } = await authClient.requestPasswordReset({
                email: data.email,
                redirectTo: `${window.location.origin}/?reset-password=true`,
            })

            if (error) {
                form.setError("root", {
                    message: error.message,
                })
            } else {
                onSuccess?.(data.email)
            }
        },
        [form, onSuccess],
    )

    return (
        <form className="space-y-4 w-full" onSubmit={form.handleSubmit(handleSubmit)}>
            <FieldGroup>
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

                {form.formState.errors.root && <FieldError errors={[form.formState.errors.root]} />}
            </FieldGroup>

            {trigger(form.formState.isSubmitting)}
        </form>
    )
}
