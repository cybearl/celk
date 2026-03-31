import { useSessionContext } from "@app/components/contexts/Session"
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
import type { UserOptionsSelectModel } from "@app/db/schema/userOptions"
import { useUserOptions } from "@app/hooks/api/useUserOptions"
import { authClient } from "@app/lib/client/connectors/authClient"
import { deleteUserAccount, updateUserInfo, updateUserOptions } from "@app/queries/users"
import { CyCONSTANTS } from "@cybearl/cypack"
import { zodResolver } from "@hookform/resolvers/zod"
import { TRPCClientError } from "@trpc/client"
import { useCallback, useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import z from "zod"

const profileFormSchema = z.object({
    name: z.string().min(1, "Name is required."),
    username: z
        .string()
        .min(
            CyCONSTANTS.MIN_USERNAME_LENGTH,
            `Username must be at least ${CyCONSTANTS.MIN_USERNAME_LENGTH} characters.`,
        )
        .max(CyCONSTANTS.MAX_USERNAME_LENGTH, `Username must be at most ${CyCONSTANTS.MAX_USERNAME_LENGTH} characters.`)
        .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, underscores, dashes and dots."),
})

const preferencesFormSchema = z.object({
    autoDisableZeroBalance: z.boolean(),
    mixGenerators: z.boolean(),
})

const passwordFormSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required."),
        newPassword: z
            .string()
            .min(
                CyCONSTANTS.MIN_PASSWORD_LENGTH,
                `Password must be at least ${CyCONSTANTS.MIN_PASSWORD_LENGTH} characters.`,
            )
            .max(
                CyCONSTANTS.MAX_PASSWORD_LENGTH,
                `Password must be at most ${CyCONSTANTS.MAX_PASSWORD_LENGTH} characters.`,
            ),
        confirmPassword: z.string().min(1, "Please confirm your password."),
    })
    .refine(data => data.newPassword === data.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords do not match.",
    })

type ProfileFormData = z.infer<typeof profileFormSchema>
type PreferencesFormData = z.infer<typeof preferencesFormSchema>
type PasswordFormData = z.infer<typeof passwordFormSchema>

type SettingsPageProps = {
    initialUserOptions: UserOptionsSelectModel | null
}

export default function SettingsPage({ initialUserOptions }: SettingsPageProps) {
    const { session, refetchSession } = useSessionContext()
    const { data: userOptions } = useUserOptions(initialUserOptions)

    // Profile form
    const profileForm = useForm<ProfileFormData>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: session
            ? {
                  name: session.user.name,
                  username: session.user.username,
              }
            : undefined,
    })

    // Reset the profile form when session changes
    useEffect(() => {
        if (!session) return

        profileForm.reset({
            name: session.user.name,
            username: session.user.username,
        })
    }, [session, profileForm])

    // Preferences form
    const preferencesForm = useForm<PreferencesFormData>({
        resolver: zodResolver(preferencesFormSchema),
        defaultValues: {
            autoDisableZeroBalance: userOptions?.autoDisableZeroBalance ?? false,
            mixGenerators: userOptions?.mixGenerators ?? false,
        },
    })

    // Reset the preferences form when user options change
    useEffect(() => {
        if (!userOptions) return

        preferencesForm.reset({
            autoDisableZeroBalance: userOptions.autoDisableZeroBalance,
            mixGenerators: userOptions.mixGenerators,
        })
    }, [userOptions, preferencesForm])

    // Password form (always starts empty)
    const passwordForm = useForm<PasswordFormData>({
        resolver: zodResolver(passwordFormSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    })

    /**
     * Handles form submission for the profile settings.
     * @param data The form data.
     */
    const handleProfileSubmit = useCallback(
        async (data: ProfileFormData) => {
            try {
                await updateUserInfo(data)
                await refetchSession()
                toast.success("Profile updated successfully.")
            } catch (error) {
                if (error instanceof TRPCClientError) {
                    profileForm.setError("root", { message: error.message })
                } else {
                    profileForm.setError("root", { message: "Failed to update profile, please try again." })
                }
            }
        },
        [profileForm, refetchSession],
    )

    /**
     * Handles form reset for the profile settings.
     */
    const handleProfileReset = useCallback(() => {
        if (!session) return

        profileForm.reset({
            name: session.user.name,
            username: session.user.username,
        })
    }, [session, profileForm])

    /**
     * Handles form submission for the preferences settings.
     * @param data The form data.
     */
    const handlePreferencesSubmit = useCallback(
        async (data: PreferencesFormData) => {
            try {
                await updateUserOptions(data)
                toast.success("Preferences saved.")
            } catch (error) {
                if (error instanceof TRPCClientError) {
                    preferencesForm.setError("root", { message: error.message })
                } else {
                    preferencesForm.setError("root", { message: "Failed to save preferences, please try again." })
                }
            }
        },
        [preferencesForm],
    )

    /**
     * Handles form reset for the preferences settings.
     */
    const handlePreferencesReset = useCallback(() => {
        preferencesForm.reset({
            autoDisableZeroBalance: userOptions?.autoDisableZeroBalance ?? false,
            mixGenerators: userOptions?.mixGenerators ?? false,
        })
    }, [userOptions, preferencesForm])

    /**
     * Handles form submission for the password settings.
     * @param data The form data.
     */
    const handlePasswordSubmit = useCallback(
        async (data: PasswordFormData) => {
            const { error } = await authClient.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
                revokeOtherSessions: false,
            })

            if (error) {
                passwordForm.setError("root", {
                    message: error.message ?? "Failed to change password, please try again.",
                })
            } else {
                passwordForm.reset()
                toast.success("Password changed successfully.")
            }
        },
        [passwordForm],
    )

    /**
     * Handles sign out for the user.
     */
    const handleSignOut = useCallback(async () => {
        await authClient.signOut()
        await refetchSession()
    }, [refetchSession])

    /**
     * Handles account deletion for the user.
     */
    const handleDeleteAccount = useCallback(async () => {
        try {
            await deleteUserAccount()
            await refetchSession()
        } catch {
            toast.error("Failed to delete account, please try again.")
        }
    }, [refetchSession])

    return (
        <div className="h-0 min-h-full">
            <Scrollbar className="border border-border p-4 bg-black/30">
                <div className="flex-1 overflow-y-auto flex flex-col gap-8 pr-6">
                    <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
                        <FieldSet>
                            <FieldLegend>Profile</FieldLegend>
                            <FieldGroup>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Controller
                                        control={profileForm.control}
                                        name="name"
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                                                <FieldDescription>Your display name.</FieldDescription>
                                                <Input
                                                    type="text"
                                                    id={field.name}
                                                    autoComplete="name"
                                                    aria-invalid={fieldState.invalid}
                                                    placeholder="John Doe"
                                                    {...field}
                                                />
                                                {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                                            </Field>
                                        )}
                                    />

                                    <Controller
                                        control={profileForm.control}
                                        name="username"
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldLabel htmlFor={field.name}>Username</FieldLabel>
                                                <FieldDescription>
                                                    Your unique identifier used to log in.
                                                </FieldDescription>
                                                <Input
                                                    type="text"
                                                    id={field.name}
                                                    autoComplete="username"
                                                    aria-invalid={fieldState.invalid}
                                                    placeholder="john-doe"
                                                    {...field}
                                                />
                                                {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                                            </Field>
                                        )}
                                    />
                                </div>

                                {profileForm.formState.errors.root && (
                                    <FieldError errors={[profileForm.formState.errors.root]} />
                                )}

                                <div className="flex justify-end gap-2 pt-2">
                                    <ConfirmationDialog
                                        title="Reset profile"
                                        description="This will discard all unsaved changes and restore the form to your current saved profile. Are you sure?"
                                        confirmButtonText="Reset"
                                        cancelButtonText="Cancel"
                                        onConfirm={handleProfileReset}
                                    >
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={!profileForm.formState.isDirty}
                                        >
                                            Reset
                                        </Button>
                                    </ConfirmationDialog>

                                    <Button
                                        type="submit"
                                        size="sm"
                                        isLoading={profileForm.formState.isSubmitting}
                                        disabled={!profileForm.formState.isDirty}
                                    >
                                        Save Profile
                                    </Button>
                                </div>
                            </FieldGroup>
                        </FieldSet>
                    </form>

                    <Separator />

                    <form onSubmit={preferencesForm.handleSubmit(handlePreferencesSubmit)}>
                        <FieldSet>
                            <FieldLegend>Preferences</FieldLegend>
                            <FieldGroup>
                                <Controller
                                    control={preferencesForm.control}
                                    name="autoDisableZeroBalance"
                                    render={({ field }) => (
                                        <Field orientation="horizontal">
                                            <Checkbox
                                                id={field.name}
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="aspect-square w-min"
                                            />
                                            <div className="flex flex-col gap-0.5">
                                                <FieldLabel htmlFor={field.name} className="font-normal cursor-pointer">
                                                    Auto-disable zero balance addresses
                                                </FieldLabel>
                                                <FieldDescription>
                                                    When enabled, any addresses with a confirmed zero balance will be
                                                    automatically disabled.
                                                </FieldDescription>
                                            </div>
                                        </Field>
                                    )}
                                />

                                <Controller
                                    control={preferencesForm.control}
                                    name="mixGenerators"
                                    render={({ field }) => (
                                        <Field orientation="horizontal">
                                            <Checkbox
                                                id={field.name}
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="aspect-square w-min"
                                            />
                                            <div className="flex flex-col gap-0.5">
                                                <FieldLabel htmlFor={field.name} className="font-normal cursor-pointer">
                                                    Mix generators
                                                </FieldLabel>
                                                <FieldDescription>
                                                    When enabled, each generator also checks its keys against addresses
                                                    assigned to other generators, increasing coverage.
                                                </FieldDescription>
                                            </div>
                                        </Field>
                                    )}
                                />

                                {preferencesForm.formState.errors.root && (
                                    <FieldError errors={[preferencesForm.formState.errors.root]} />
                                )}

                                <div className="flex justify-end gap-2 pt-2">
                                    <ConfirmationDialog
                                        title="Reset preferences"
                                        description="This will discard all unsaved changes and restore your current saved preferences. Are you sure?"
                                        confirmButtonText="Reset"
                                        cancelButtonText="Cancel"
                                        onConfirm={handlePreferencesReset}
                                    >
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={!preferencesForm.formState.isDirty}
                                        >
                                            Reset
                                        </Button>
                                    </ConfirmationDialog>

                                    <Button
                                        type="submit"
                                        size="sm"
                                        isLoading={preferencesForm.formState.isSubmitting}
                                        disabled={!preferencesForm.formState.isDirty}
                                    >
                                        Save Preferences
                                    </Button>
                                </div>
                            </FieldGroup>
                        </FieldSet>
                    </form>

                    <Separator />

                    <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
                        <FieldSet>
                            <FieldLegend>Security</FieldLegend>
                            <FieldGroup>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Controller
                                        control={passwordForm.control}
                                        name="currentPassword"
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldLabel htmlFor={field.name}>Current password</FieldLabel>
                                                <Input
                                                    type="password"
                                                    id={field.name}
                                                    autoComplete="current-password"
                                                    aria-invalid={fieldState.invalid}
                                                    placeholder="Current password"
                                                    {...field}
                                                />
                                                {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                                            </Field>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Controller
                                        control={passwordForm.control}
                                        name="newPassword"
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldLabel htmlFor={field.name}>New password</FieldLabel>
                                                <Input
                                                    type="password"
                                                    id={field.name}
                                                    autoComplete="new-password"
                                                    aria-invalid={fieldState.invalid}
                                                    placeholder="New password"
                                                    {...field}
                                                />
                                                {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                                            </Field>
                                        )}
                                    />

                                    <Controller
                                        control={passwordForm.control}
                                        name="confirmPassword"
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldLabel htmlFor={field.name}>Confirm new password</FieldLabel>
                                                <Input
                                                    type="password"
                                                    id={field.name}
                                                    autoComplete="new-password"
                                                    aria-invalid={fieldState.invalid}
                                                    placeholder="Confirm new password"
                                                    {...field}
                                                />
                                                {fieldState.invalid && <FieldError errors={[fieldState.error!]} />}
                                            </Field>
                                        )}
                                    />
                                </div>

                                {passwordForm.formState.errors.root && (
                                    <FieldError errors={[passwordForm.formState.errors.root]} />
                                )}

                                <div className="flex justify-end pt-2">
                                    <Button
                                        type="submit"
                                        size="sm"
                                        isLoading={passwordForm.formState.isSubmitting}
                                        disabled={!passwordForm.formState.isDirty}
                                    >
                                        Change Password
                                    </Button>
                                </div>
                            </FieldGroup>
                        </FieldSet>
                    </form>

                    <Separator />

                    <FieldSet>
                        <FieldLegend>Account</FieldLegend>
                        <FieldGroup className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <FieldDescription>Sign out of your current session.</FieldDescription>
                                <div>
                                    <Button type="button" variant="outline" size="sm" onClick={handleSignOut}>
                                        Sign Out
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <FieldDescription>
                                    Permanently delete your account and all associated data, this action cannot be
                                    undone.
                                </FieldDescription>
                                <div>
                                    <ConfirmationDialog
                                        title="Delete account"
                                        description="This will permanently delete your account and all associated data, this action cannot be undone. Are you sure?"
                                        confirmButtonText="Delete Account"
                                        cancelButtonText="Cancel"
                                        onConfirm={handleDeleteAccount}
                                    >
                                        <Button type="button" variant="outline" size="sm">
                                            Delete Account
                                        </Button>
                                    </ConfirmationDialog>
                                </div>
                            </div>
                        </FieldGroup>
                    </FieldSet>
                </div>
            </Scrollbar>
        </div>
    )
}
