import { Button } from "@app/components/ui/Button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@app/components/ui/Field"
import { Input } from "@app/components/ui/Input"
import { authClient } from "@app/lib/client/connectors/auth-client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback } from "react"
import { Controller, useForm } from "react-hook-form"
import z from "zod"

const signInFormSchema = z.object({
    identifier: z.string().min(1, "Either email or username is required"),
    password: z.string().min(1, "Password is required"),
})

type SignInForm = z.infer<typeof signInFormSchema>

export default function SignInForm() {
    const form = useForm<SignInForm>({
        defaultValues: {
            identifier: "",
            password: "",
        },
        resolver: zodResolver(signInFormSchema),
    })

    const handleSubmit = useCallback(
        async (data: SignInForm) => {
            const { error } = data.identifier.includes("@")
                ? await authClient.signIn.email({
                      email: data.identifier,
                      password: data.password,
                  })
                : await authClient.signIn.username({
                      username: data.identifier,
                      password: data.password,
                  })

            if (error) {
                form.setError("root", {
                    message: error.message,
                })
            }
        },
        [form],
    )

    return (
        <form className="space-y-4 w-full" onSubmit={form.handleSubmit(handleSubmit)}>
            <FieldGroup>
                <Controller
                    control={form.control}
                    name="identifier"
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Email / Username</FieldLabel>
                            <Input
                                aria-invalid={fieldState.invalid}
                                id={field.name}
                                placeholder="john.doe@example.com / john-doe"
                                {...field}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                        </Field>
                    )}
                />

                <Controller
                    control={form.control}
                    name="password"
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                            <Input
                                type="password"
                                aria-invalid={fieldState.invalid}
                                id={field.name}
                                placeholder="Password"
                                {...field}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                        </Field>
                    )}
                />

                {form.formState.errors.root && <FieldError errors={[form.formState.errors.root]} />}
            </FieldGroup>

            <Button type="submit">Sign In</Button>
        </form>
    )
}
