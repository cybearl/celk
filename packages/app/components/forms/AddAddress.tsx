import { Checkbox } from "@app/components/ui/Checkbox"
import { Field, FieldError, FieldGroup, FieldLabel } from "@app/components/ui/Field"
import { Input } from "@app/components/ui/Input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@app/components/ui/Select"
import { ADDRESS_NETWORK, ADDRESS_TYPE } from "@app/db/schema/address"
import {
    getAddressPrefix,
    getCompatibleAddressTypes,
    getFormattedAddressNetwork,
    getFormattedAddressType,
    isValidCryptoAddress,
} from "@app/lib/base/utils/addresses"
import { zodResolver } from "@hookform/resolvers/zod"
import { type ReactNode, useCallback, useEffect, useMemo } from "react"
import { Controller, useForm } from "react-hook-form"
import z from "zod"

const addAddressFormSchema = z
    .object({
        name: z.string().min(1, "Name is required."),
        type: z.enum(ADDRESS_TYPE),
        network: z.enum(ADDRESS_NETWORK),
        value: z.string().min(1, "Address value is required."),
        bypassChecksum: z.boolean().optional(),
    })
    .superRefine(({ type, value, bypassChecksum }, ctx) => {
        if (!type || !value || bypassChecksum) return

        if (!isValidCryptoAddress(type, value)) {
            ctx.addIssue({
                code: "custom",
                message: "Invalid address (check format and checksum).",
                path: ["value"],
            })
        }
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
            value: "",
        },
        resolver: zodResolver(addAddressFormSchema),
    })

    const network = form.watch("network")
    const type = form.watch("type")

    // Reset type whenever network changes to ensure a compatible type is always set
    useEffect(() => {
        if (!network) return

        if (network === ADDRESS_NETWORK.BITCOIN) {
            const compatibleTypes = getCompatibleAddressTypes(network)
            if (!compatibleTypes.includes(type)) form.setValue("type", compatibleTypes[0])
        } else {
            form.setValue("type", ADDRESS_TYPE.ETHEREUM)
        }
    }, [network, form, type])

    /**
     * Handles the submission of the add address form.
     * @param data The form data containing the address details to be added.
     */
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

    /**
     * The placeholder for the address based on its type.
     */
    const valuePlaceholder = useMemo(() => `${getAddressPrefix({ type }) ?? "X"}..`, [type])

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
                    name="network"
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Network</FieldLabel>
                            <Select value={field.value} name={field.name} onValueChange={field.onChange}>
                                <SelectTrigger id={field.name} aria-invalid={fieldState.invalid}>
                                    <SelectValue placeholder="Select network" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {Object.values(ADDRESS_NETWORK).map(network => (
                                            <SelectItem key={network} value={network}>
                                                {getFormattedAddressNetwork(network)}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
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
                            <Select
                                value={field.value}
                                name={field.name}
                                onValueChange={field.onChange}
                                disabled={!network || network !== ADDRESS_NETWORK.BITCOIN}
                            >
                                <SelectTrigger id={field.name} aria-invalid={fieldState.invalid}>
                                    <SelectValue placeholder="Select address type">
                                        {field.value ? (
                                            <>
                                                {getFormattedAddressType(field.value)}{" "}
                                                <span className="italic text-muted-foreground">
                                                    ({getAddressPrefix({ type: field.value }) ?? "X"}..)
                                                </span>
                                            </>
                                        ) : undefined}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {network && (
                                            <>
                                                {getCompatibleAddressTypes(network).map(type => (
                                                    <SelectItem key={type} value={type}>
                                                        {getFormattedAddressType(type)}{" "}
                                                        <span className="italic text-muted-foreground">
                                                            ({getAddressPrefix({ type }) ?? "X"}..)
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </>
                                        )}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}

                            {!network && (
                                <p className="text-xs text-muted-foreground">
                                    (Select a network to choose the address type)
                                </p>
                            )}
                        </Field>
                    )}
                />

                <Controller
                    control={form.control}
                    name="value"
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Value</FieldLabel>
                            <Input
                                type="text"
                                aria-invalid={fieldState.invalid}
                                id={field.name}
                                placeholder={valuePlaceholder}
                                {...field}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                        </Field>
                    )}
                />

                <Controller
                    control={form.control}
                    name="bypassChecksum"
                    render={({ field }) => (
                        <Field orientation="horizontal">
                            <Checkbox
                                id={field.name}
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                                className="aspect-square w-min"
                            />
                            <FieldLabel htmlFor={field.name} className="font-normal cursor-pointer">
                                Bypass checksum validation
                            </FieldLabel>
                        </Field>
                    )}
                />

                {form.formState.errors.root && <FieldError errors={[form.formState.errors.root]} />}
            </FieldGroup>

            {trigger(form.formState.isSubmitting)}
        </form>
    )
}
