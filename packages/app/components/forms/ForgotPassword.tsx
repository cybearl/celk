import { Field, FieldError, FieldGroup, FieldLabel } from "@app/components/ui/Field"
import { Input } from "@app/components/ui/Input"
import { authClient } from "@app/lib/client/connectors/auth-client"
import { zodResolver } from "@hookform/resolvers/zod"
import { type ReactNode, useCallback } from "react"
import { Controller, useForm } from "react-hook-form"
import z from "zod"

const forgotPasswordFormSchema = z.object({
    email: z.email("Invalid email address"),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordFormSchema>

type ForgotPasswordFormProps = {
    trigger: (isSubmitting: boolean) => ReactNode
    redirectTo: string
    onSuccess?: () => void
}

export default function ForgotPasswordForm({ trigger, redirectTo, onSuccess }: ForgotPasswordFormProps) {
    const form = useForm<ForgotPasswordForm>({
        defaultValues: {
            email: "",
        },
        resolver: zodResolver(forgotPasswordFormSchema),
    })

    const handleSubmit = useCallback(
        async (data: ForgotPasswordForm) => {
            const { error } = await authClient.requestPasswordReset({
                email: data.email,
                redirectTo,
            })

            if (error) {
                form.setError("root", {
                    message: error.message,
                })
            } else {
                onSuccess?.()
            }
        },
        [form, redirectTo, onSuccess],
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
