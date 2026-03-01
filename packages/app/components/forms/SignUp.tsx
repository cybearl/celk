import { Field, FieldError, FieldGroup, FieldLabel } from "@app/components/ui/Field"
import { Input } from "@app/components/ui/Input"
import { authClient } from "@app/lib/client/connectors/auth-client"
import { CyCONSTANTS } from "@cybearl/cypack"
import { zodResolver } from "@hookform/resolvers/zod"
import { type ReactNode, useCallback } from "react"
import { Controller, useForm } from "react-hook-form"
import z from "zod"

const signUpFormSchema = z
    .object({
        name: z.string().min(1, "Name is required"),
        username: z
            .string()
            .min(
                CyCONSTANTS.MIN_USERNAME_LENGTH,
                `Username must be at least ${CyCONSTANTS.MIN_USERNAME_LENGTH} characters`,
            )
            .max(
                CyCONSTANTS.MAX_USERNAME_LENGTH,
                `Username must be at most ${CyCONSTANTS.MAX_USERNAME_LENGTH} characters`,
            )
            .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, underscores, dashes and dots"),
        email: z.email("Invalid email address"),
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

type SignUpForm = z.infer<typeof signUpFormSchema>

type SignUpFormProps = {
    trigger: (isSubmitting: boolean) => ReactNode
    onSuccess?: (email: string) => void
}

export default function SignUpForm({ trigger, onSuccess }: SignUpFormProps) {
    const form = useForm<SignUpForm>({
        defaultValues: {
            name: "",
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
        resolver: zodResolver(signUpFormSchema),
    })

    const handleSubmit = useCallback(
        async (data: SignUpForm) => {
            const { error } = await authClient.signUp.email({
                name: data.name,
                username: data.username,
                email: data.email,
                password: data.password,
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
                    name="name"
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                            <Input
                                type="text"
                                autoComplete="name"
                                aria-invalid={fieldState.invalid}
                                id={field.name}
                                placeholder="John Doe"
                                {...field}
                            />
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
                                type="text"
                                autoComplete="username"
                                aria-invalid={fieldState.invalid}
                                id={field.name}
                                placeholder="john-doe"
                                {...field}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                        </Field>
                    )}
                />

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

                <Controller
                    control={form.control}
                    name="password"
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                            <Input
                                type="password"
                                autoComplete="new-password"
                                aria-invalid={fieldState.invalid}
                                id={field.name}
                                placeholder="Password"
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
                            <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
                            <Input
                                type="password"
                                autoComplete="new-password"
                                aria-invalid={fieldState.invalid}
                                id={field.name}
                                placeholder="Confirm password"
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
