import { Field, FieldError, FieldGroup, FieldLabel } from "@app/components/ui/Field"
import { Input } from "@app/components/ui/Input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback } from "react"
import { Controller, useForm } from "react-hook-form"
import z from "zod"

const signInFormSchema = z.object({
    identifier: z.string(),
    password: z.string(),
})

type SignInForm = z.infer<typeof signInFormSchema>

export default function SignInForm() {
    const form = useForm<SignInForm>({
        defaultValues: {
            email: "",
            username: "",
            password: "",
        },
        resolver: zodResolver(signInFormSchema),
    })

    const handleSubmit = useCallback(async (data: SignInForm) => {
        // Handle form submission
        console.log("Form submitted:", data)
    }, [])

    return (
        <form className="space-y-4 w-full" onSubmit={form.handleSubmit(handleSubmit)}>
            <FieldGroup>
                <Controller
                    control={form.control}
                    name="email"
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                            <Input aria-invalid={fieldState.invalid} id={field.name} placeholder="Email" {...field} />
                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                        </Field>
                    )}
                />

                <Controller
                    control={form.control}
                    name="username"
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Username</FieldLabel>
                            <Input
                                aria-invalid={fieldState.invalid}
                                id={field.name}
                                placeholder="Username"
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
            </FieldGroup>
        </form>
    )
}
