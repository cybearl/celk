import { Field, FieldError, FieldGroup, FieldLabel } from "@app/components/ui/Field"
import { Input } from "@app/components/ui/Input"
import { Select } from "@app/components/ui/Select"
import { ADDRESS_NETWORK, ADDRESS_TYPE } from "@app/db/schema/address"
import { zodResolver } from "@hookform/resolvers/zod"
import { type ReactNode, useCallback } from "react"
import { Controller, useForm } from "react-hook-form"
import z from "zod"

const addAddressFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.enum(ADDRESS_TYPE),
    network: z.enum(ADDRESS_NETWORK),
    value: z.string().min(1, "Address value is required"),
    decrypted: z.string().min(1, "Decrypted form is required"),
    privateKey: z.string().optional(),
})

export type AddAddressFormData = z.infer<typeof addAddressFormSchema>

type AddAddressFormProps = {
    trigger: (isSubmitting: boolean) => ReactNode
    onSubmit: (data: AddAddressFormData) => Promise<{ error?: { message: string } }>
    onSuccess?: () => void
}

export default function AddAddressForm({ trigger, onSubmit, onSuccess }: AddAddressFormProps) {
    const form = useForm<AddAddressFormData>({
        defaultValues: {
            name: "",
            type: ADDRESS_TYPE.ETHEREUM,
            network: ADDRESS_NETWORK.ETHEREUM,
            value: "",
            decrypted: "",
            privateKey: "",
        },
        resolver: zodResolver(addAddressFormSchema),
    })

    const handleSubmit = useCallback(
        async (data: AddAddressFormData) => {
            const result = await onSubmit(data)

            if (result?.error) {
                form.setError("root", {
                    message: result.error.message,
                })
            } else {
                onSuccess?.()
            }
        },
        [form, onSubmit, onSuccess],
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
                                aria-invalid={fieldState.invalid}
                                id={field.name}
                                placeholder="My Ethereum Wallet"
                                {...field}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                        </Field>
                    )}
                />

                <Controller
                    control={form.control}
                    name="type"
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Type</FieldLabel>
                            <Select aria-invalid={fieldState.invalid} id={field.name} {...field}>
                                <option value={ADDRESS_TYPE.ETHEREUM}>Ethereum</option>
                                <option value={ADDRESS_TYPE.BTC_P2PKH}>Bitcoin P2PKH</option>
                                <option value={ADDRESS_TYPE.BTC_P2WPKH}>Bitcoin P2WPKH</option>
                            </Select>
                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                        </Field>
                    )}
                />

                <Controller
                    control={form.control}
                    name="network"
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Network</FieldLabel>
                            <Select aria-invalid={fieldState.invalid} id={field.name} {...field}>
                                <option value={ADDRESS_NETWORK.ETHEREUM}>Ethereum</option>
                                <option value={ADDRESS_NETWORK.BITCOIN}>Bitcoin</option>
                                <option value={ADDRESS_NETWORK.POLYGON}>Polygon</option>
                            </Select>
                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                        </Field>
                    )}
                />

                <Controller
                    control={form.control}
                    name="value"
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Address</FieldLabel>
                            <Input
                                type="text"
                                aria-invalid={fieldState.invalid}
                                id={field.name}
                                placeholder="0x..."
                                {...field}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                        </Field>
                    )}
                />

                <Controller
                    control={form.control}
                    name="decrypted"
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Decrypted form</FieldLabel>
                            <Input
                                type="text"
                                aria-invalid={fieldState.invalid}
                                id={field.name}
                                placeholder="Raw pre-encoding value"
                                {...field}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                        </Field>
                    )}
                />

                <Controller
                    control={form.control}
                    name="privateKey"
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Private key (optional)</FieldLabel>
                            <Input
                                type="password"
                                aria-invalid={fieldState.invalid}
                                id={field.name}
                                placeholder="Private key"
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
