import ConfirmationDialog from "@app/components/dialogs/Confirmation"
import { Button } from "@app/components/ui/Button"
import { Checkbox } from "@app/components/ui/Checkbox"
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from "@app/components/ui/Field"
import { Input } from "@app/components/ui/Input"
import Scrollbar from "@app/components/ui/Scrollbar"
import { Separator } from "@app/components/ui/Separator"
import toast from "@app/components/ui/Toast"
import type { DynamicConfigSelectModel } from "@app/db/schema/dynamicConfig"
import { useDynamicConfig } from "@app/hooks/api/useDynamicConfig"
import { updateDynamicConfig } from "@app/queries/dynamicConfig"
import { zodResolver } from "@hookform/resolvers/zod"
import { TRPCClientError } from "@trpc/client"
import { useCallback, useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import z from "zod"

const adminConfigFormSchema = z.object({
    lockNewUsers: z.boolean(),
    maxAddressesPerUser: z.number().int().positive("Must be a positive integer."),
    maxAddressListsPerUser: z.number().int().positive("Must be a positive integer."),
    maxAddressesPerList: z.number().int().positive("Must be a positive integer."),
    maxRunningAddressListsPerUser: z.number().int().positive("Must be a positive integer."),
    balanceCheckerDelayMs: z.number().int().positive("Must be a positive integer."),
    maxBalanceCheckerRetries: z.number().int().positive("Must be a positive integer."),
    balanceCheckerRetryBaseDelayMs: z.number().int().positive("Must be a positive integer."),
    balanceCheckerRetryMaxDelayMs: z.number().int().positive("Must be a positive integer."),
    workersManagerPollIntervalMs: z.number().int().positive("Must be a positive integer."),
    maxWorkersManagerSyncRetries: z.number().int().positive("Must be a positive integer."),
    workersManagerSyncRetryBaseDelayMs: z.number().int().positive("Must be a positive integer."),
    workersManagerSyncRetryMaxDelayMs: z.number().int().positive("Must be a positive integer."),
    workerReportIntervalMs: z.number().int().positive("Must be a positive integer."),
})

type AdminConfigFormData = z.infer<typeof adminConfigFormSchema>

type AdminPanelDashboardTabProps = {
    dynamicConfig: DynamicConfigSelectModel | null
}

/**
 * Converts the dynamic config to form values.
 * @param config The dynamic config to convert.
 * @returns The form values.
 */
function configToFormValues(config: DynamicConfigSelectModel): AdminConfigFormData {
    return {
        lockNewUsers: config.lockNewUsers,
        maxAddressesPerUser: config.maxAddressesPerUser,
        maxAddressListsPerUser: config.maxAddressListsPerUser,
        maxAddressesPerList: config.maxAddressesPerList,
        maxRunningAddressListsPerUser: config.maxRunningAddressListsPerUser,
        balanceCheckerDelayMs: config.balanceCheckerDelayMs,
        maxBalanceCheckerRetries: config.maxBalanceCheckerRetries,
        balanceCheckerRetryBaseDelayMs: config.balanceCheckerRetryBaseDelayMs,
        balanceCheckerRetryMaxDelayMs: config.balanceCheckerRetryMaxDelayMs,
        workersManagerPollIntervalMs: config.workersManagerPollIntervalMs,
        maxWorkersManagerSyncRetries: config.maxWorkersManagerSyncRetries,
        workersManagerSyncRetryBaseDelayMs: config.workersManagerSyncRetryBaseDelayMs,
        workersManagerSyncRetryMaxDelayMs: config.workersManagerSyncRetryMaxDelayMs,
        workerReportIntervalMs: config.workerReportIntervalMs,
    }
}

export default function AdminPanelDashboardTab({ dynamicConfig: initialConfig }: AdminPanelDashboardTabProps) {
    const { data: config } = useDynamicConfig(initialConfig)

    const form = useForm<AdminConfigFormData>({
        resolver: zodResolver(adminConfigFormSchema),
        defaultValues: config ? configToFormValues(config) : undefined,
    })

    // Reset form values when the config changes
    useEffect(() => {
        if (!config) return
        form.reset(configToFormValues(config))
    }, [config, form])

    /**
     * Handle the form reset action.
     */
    const handleReset = useCallback(() => {
        if (!config) return
        form.reset(configToFormValues(config))
    }, [config, form])

    /**
     * Handle the dynamic config update form submission.
     * @param data The form data to submit.
     */
    const handleSubmit = useCallback(
        async (data: AdminConfigFormData) => {
            try {
                await updateDynamicConfig(data)
                toast.success("The configuration has been updated successfully.")
            } catch (error) {
                if (error instanceof TRPCClientError) {
                    form.setError("root", { message: error.message })
                } else {
                    form.setError("root", { message: "Failed to save configuration, please try again." })
                }
            }
        },
        [form],
    )

    return (
        <form className="flex flex-col gap-8 h-0 min-h-full" onSubmit={form.handleSubmit(handleSubmit)}>
            <Scrollbar className="border border-border p-4 bg-black/30">
                <div className="flex-1 overflow-y-auto flex flex-col gap-8 pr-6">
                    <FieldSet>
                        <FieldLegend>Flags</FieldLegend>
                        <FieldGroup>
                            <Controller
                                control={form.control}
                                name="lockNewUsers"
                                render={({ field }) => (
                                    <Field orientation="horizontal">
                                        <Checkbox
                                            id={field.name}
                                            checked={field.value ?? false}
                                            onCheckedChange={field.onChange}
                                            className="aspect-square w-min"
                                        />
                                        <div className="flex flex-col gap-0.5">
                                            <FieldLabel htmlFor={field.name} className="font-normal cursor-pointer">
                                                Lock new user registrations
                                            </FieldLabel>
                                            <FieldDescription>
                                                When enabled, new sign-ups are rejected. Existing users are unaffected.
                                            </FieldDescription>
                                        </div>
                                    </Field>
                                )}
                            />
                        </FieldGroup>
                    </FieldSet>

                    <Separator />

                    <FieldSet>
                        <FieldLegend>User Limits</FieldLegend>
                        <FieldGroup>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Controller
                                    control={form.control}
                                    name="maxAddressesPerUser"
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor={field.name}>Max addresses per user</FieldLabel>
                                            <FieldDescription>
                                                Maximum total addresses a single user can register.
                                            </FieldDescription>
                                            <Input
                                                type="number"
                                                id={field.name}
                                                min={1}
                                                aria-invalid={fieldState.invalid}
                                                value={field.value ?? ""}
                                                onChange={e => field.onChange(e.target.valueAsNumber)}
                                                onBlur={field.onBlur}
                                            />
                                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    control={form.control}
                                    name="maxAddressListsPerUser"
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor={field.name}>Max address lists per user</FieldLabel>
                                            <FieldDescription>
                                                Maximum number of address lists a single user can create.
                                            </FieldDescription>
                                            <Input
                                                type="number"
                                                id={field.name}
                                                min={1}
                                                aria-invalid={fieldState.invalid}
                                                value={field.value ?? ""}
                                                onChange={e => field.onChange(e.target.valueAsNumber)}
                                                onBlur={field.onBlur}
                                            />
                                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    control={form.control}
                                    name="maxAddressesPerList"
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor={field.name}>Max addresses per list</FieldLabel>
                                            <FieldDescription>
                                                Maximum number of addresses that can be added to a single list.
                                            </FieldDescription>
                                            <Input
                                                type="number"
                                                id={field.name}
                                                min={1}
                                                aria-invalid={fieldState.invalid}
                                                value={field.value ?? ""}
                                                onChange={e => field.onChange(e.target.valueAsNumber)}
                                                onBlur={field.onBlur}
                                            />
                                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    control={form.control}
                                    name="maxRunningAddressListsPerUser"
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor={field.name}>Max running lists per user</FieldLabel>
                                            <FieldDescription>
                                                Maximum number of address lists a user can have actively scanning at
                                                once.
                                            </FieldDescription>
                                            <Input
                                                type="number"
                                                id={field.name}
                                                min={1}
                                                aria-invalid={fieldState.invalid}
                                                value={field.value ?? ""}
                                                onChange={e => field.onChange(e.target.valueAsNumber)}
                                                onBlur={field.onBlur}
                                            />
                                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                                        </Field>
                                    )}
                                />
                            </div>
                        </FieldGroup>
                    </FieldSet>

                    <Separator />

                    <FieldSet>
                        <FieldLegend>Balance Checker</FieldLegend>
                        <FieldGroup>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Controller
                                    control={form.control}
                                    name="balanceCheckerDelayMs"
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor={field.name}>Poll delay (ms)</FieldLabel>
                                            <FieldDescription>
                                                Interval between balance check cycles in milliseconds (e.g., 600000 = 10
                                                min).
                                            </FieldDescription>
                                            <Input
                                                type="number"
                                                id={field.name}
                                                min={1}
                                                aria-invalid={fieldState.invalid}
                                                value={field.value ?? ""}
                                                onChange={e => field.onChange(e.target.valueAsNumber)}
                                                onBlur={field.onBlur}
                                            />
                                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    control={form.control}
                                    name="maxBalanceCheckerRetries"
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor={field.name}>Max retries</FieldLabel>
                                            <FieldDescription>
                                                Maximum number of retry attempts before giving up on a balance check.
                                            </FieldDescription>
                                            <Input
                                                type="number"
                                                id={field.name}
                                                min={1}
                                                aria-invalid={fieldState.invalid}
                                                value={field.value ?? ""}
                                                onChange={e => field.onChange(e.target.valueAsNumber)}
                                                onBlur={field.onBlur}
                                            />
                                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    control={form.control}
                                    name="balanceCheckerRetryBaseDelayMs"
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor={field.name}>Retry base delay (ms)</FieldLabel>
                                            <FieldDescription>
                                                Initial backoff delay before the first retry in milliseconds (e.g., 5000
                                                = 5 s).
                                            </FieldDescription>
                                            <Input
                                                type="number"
                                                id={field.name}
                                                min={1}
                                                aria-invalid={fieldState.invalid}
                                                value={field.value ?? ""}
                                                onChange={e => field.onChange(e.target.valueAsNumber)}
                                                onBlur={field.onBlur}
                                            />
                                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    control={form.control}
                                    name="balanceCheckerRetryMaxDelayMs"
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor={field.name}>Retry max delay (ms)</FieldLabel>
                                            <FieldDescription>
                                                Cap on exponential backoff delay in milliseconds (e.g., 3600000 = 1 h).
                                            </FieldDescription>
                                            <Input
                                                type="number"
                                                id={field.name}
                                                min={1}
                                                aria-invalid={fieldState.invalid}
                                                value={field.value ?? ""}
                                                onChange={e => field.onChange(e.target.valueAsNumber)}
                                                onBlur={field.onBlur}
                                            />
                                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                                        </Field>
                                    )}
                                />
                            </div>
                        </FieldGroup>
                    </FieldSet>

                    <Separator />

                    <FieldSet>
                        <FieldLegend>Workers Manager</FieldLegend>
                        <FieldGroup>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Controller
                                    control={form.control}
                                    name="workersManagerPollIntervalMs"
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor={field.name}>Poll interval (ms)</FieldLabel>
                                            <FieldDescription>
                                                How often the workers manager polls for pending jobs in milliseconds
                                                (e.g., 10000 = 10 s).
                                            </FieldDescription>
                                            <Input
                                                type="number"
                                                id={field.name}
                                                min={1}
                                                aria-invalid={fieldState.invalid}
                                                value={field.value ?? ""}
                                                onChange={e => field.onChange(e.target.valueAsNumber)}
                                                onBlur={field.onBlur}
                                            />
                                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    control={form.control}
                                    name="maxWorkersManagerSyncRetries"
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor={field.name}>Max sync retries</FieldLabel>
                                            <FieldDescription>
                                                Maximum number of retry attempts for a failed worker sync.
                                            </FieldDescription>
                                            <Input
                                                type="number"
                                                id={field.name}
                                                min={1}
                                                aria-invalid={fieldState.invalid}
                                                value={field.value ?? ""}
                                                onChange={e => field.onChange(e.target.valueAsNumber)}
                                                onBlur={field.onBlur}
                                            />
                                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    control={form.control}
                                    name="workersManagerSyncRetryBaseDelayMs"
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor={field.name}>Sync retry base delay (ms)</FieldLabel>
                                            <FieldDescription>
                                                Initial backoff delay before the first sync retry in milliseconds (e.g.,
                                                5000 = 5 s).
                                            </FieldDescription>
                                            <Input
                                                type="number"
                                                id={field.name}
                                                min={1}
                                                aria-invalid={fieldState.invalid}
                                                value={field.value ?? ""}
                                                onChange={e => field.onChange(e.target.valueAsNumber)}
                                                onBlur={field.onBlur}
                                            />
                                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    control={form.control}
                                    name="workersManagerSyncRetryMaxDelayMs"
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor={field.name}>Sync retry max delay (ms)</FieldLabel>
                                            <FieldDescription>
                                                Cap on exponential backoff for sync retries in milliseconds (e.g.,
                                                3600000 = 1 h).
                                            </FieldDescription>
                                            <Input
                                                type="number"
                                                id={field.name}
                                                min={1}
                                                aria-invalid={fieldState.invalid}
                                                value={field.value ?? ""}
                                                onChange={e => field.onChange(e.target.valueAsNumber)}
                                                onBlur={field.onBlur}
                                            />
                                            {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                                        </Field>
                                    )}
                                />
                            </div>
                        </FieldGroup>
                    </FieldSet>

                    <Separator />

                    <FieldSet>
                        <FieldLegend>Worker</FieldLegend>
                        <FieldGroup>
                            <Controller
                                control={form.control}
                                name="workerReportIntervalMs"
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={field.name}>Report interval (ms)</FieldLabel>
                                        <FieldDescription>
                                            How often each worker reports its progress back to the manager in
                                            milliseconds (e.g., 4000 = 4 s).
                                        </FieldDescription>
                                        <Input
                                            type="number"
                                            id={field.name}
                                            min={1}
                                            aria-invalid={fieldState.invalid}
                                            value={field.value ?? ""}
                                            onChange={e => field.onChange(e.target.valueAsNumber)}
                                            onBlur={field.onBlur}
                                        />
                                        {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                                    </Field>
                                )}
                            />
                        </FieldGroup>
                    </FieldSet>
                </div>
            </Scrollbar>

            {form.formState.errors.root && <FieldError errors={[form.formState.errors.root]} />}

            <div className="flex justify-end gap-2">
                <ConfirmationDialog
                    title="Reset configuration"
                    description="This will discard all unsaved changes and restore the form to the current saved values, are you sure?"
                    confirmButtonText="Reset"
                    cancelButtonText="Cancel"
                    onConfirm={handleReset}
                >
                    <Button type="button" variant="outline" size="sm" disabled={!form.formState.isDirty}>
                        Reset
                    </Button>
                </ConfirmationDialog>

                <Button
                    type="submit"
                    size="sm"
                    isLoading={form.formState.isSubmitting}
                    disabled={!form.formState.isDirty}
                >
                    Save Configuration
                </Button>
            </div>
        </form>
    )
}
