import AddressListEntries from "@app/components/ui/addresses/ListEntries"
import { Field, FieldError, FieldGroup, FieldLabel } from "@app/components/ui/Field"
import { Input } from "@app/components/ui/Input"
import { TextArea } from "@app/components/ui/TextArea"
import type { AddressSelectModel } from "@app/db/schema/address"
import type { ConfigSelectModel } from "@app/db/schema/config"
import { zodResolver } from "@hookform/resolvers/zod"
import { type ReactNode, useCallback } from "react"
import { Controller, useForm } from "react-hook-form"
import z from "zod"

const addAddressListFormSchema = z.object({
    name: z.string().min(1, "Name is required."),
    description: z.string().optional(),
    addressIds: z.array(z.string()).min(1, "At least one address is required."),
})

export type AddAddressListFormData = z.infer<typeof addAddressListFormSchema>

type AddAddressListFormProps = {
    config: ConfigSelectModel | null
    addresses: AddressSelectModel[] | null
    trigger: (isSubmitting: boolean) => ReactNode
    onSubmit: (data: AddAddressListFormData) => Promise<{ error?: { message: string } }>
    onSuccess?: () => void
}

export default function AddAddressListForm({
    config,
    addresses,
    trigger,
    onSubmit,
    onSuccess,
}: AddAddressListFormProps) {
    const form = useForm<AddAddressListFormData>({
        defaultValues: {
            name: "",
            description: "",
            addressIds: [],
        },
        resolver: zodResolver(addAddressListFormSchema),
    })

    /**
     * Handles the submission of the add address list form.
     * @param data The form data containing the name of the address list and the selected address IDs.
     */
    const handleSubmit = useCallback(
        async (data: AddAddressListFormData) => {
            const result = await onSubmit(data)

            if (result?.error) {
                form.setError("root", { message: result.error.message })
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
                                placeholder="My Address List"
                                {...field}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                        </Field>
                    )}
                />

                <Controller
                    control={form.control}
                    name="description"
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                            <TextArea id={field.name} placeholder="A description for my address list" {...field} />
                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                        </Field>
                    )}
                />

                <Controller
                    control={form.control}
                    name="addressIds"
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>Addresses</FieldLabel>

                            <AddressListEntries
                                config={config}
                                addresses={addresses}
                                value={field.value}
                                onChange={field.onChange}
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
