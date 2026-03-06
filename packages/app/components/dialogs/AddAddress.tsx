import { useSessionContext } from "@app/components/contexts/Session"
import AddAddressForm, { type AddAddressFormData } from "@app/components/forms/AddAddress"
import { Button } from "@app/components/ui/Button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@app/components/ui/Dialog"
import toast from "@app/components/ui/Toast"
import type { AddressSelectModel } from "@app/db/schema/address"
import { createAddress } from "@app/queries/addresses"
import { DialogTrigger } from "@radix-ui/react-dialog"
import { TRPCClientError } from "@trpc/client"
import { Plus } from "lucide-react"
import { useCallback, useState } from "react"

type AddAddressDialogProps = {
    addresses: AddressSelectModel[] | null
    onSuccess?: () => void
}

export default function AddAddressDialog({ addresses, onSuccess }: AddAddressDialogProps) {
    const { session } = useSessionContext()

    const [isOpen, setIsOpen] = useState(false)

    /**
     * Handles the change of the dialog open state.
     */
    const handleOpenChange = useCallback((isOpen: boolean) => {
        setIsOpen(isOpen)
    }, [])

    /**
     * Handles the submission of the add address form.
     * @param data The form data containing the new address information to be added.
     */
    const handleAddAddress = useCallback(
        async (data: AddAddressFormData) => {
            if (!session?.user) {
                toast.error("It looks like you're not logged in, please log in to add an address.")
                return {}
            }

            if (addresses?.some(a => a.name.toLowerCase() === data.name.toLowerCase())) {
                return {
                    error: {
                        message: "An address with this name already exists.",
                    },
                }
            }

            if (addresses?.some(a => a.value.toLowerCase() === data.value.toLowerCase())) {
                return {
                    error: {
                        message: "This address is already registered.",
                    },
                }
            }

            try {
                await createAddress(data)
                return {}
            } catch (error) {
                if (error instanceof TRPCClientError) {
                    return {
                        error: { message: error.message },
                    }
                }

                return {
                    error: {
                        message: "An error occurred while adding the address, please try again.",
                    },
                }
            }
        },
        [session, addresses],
    )

    /**
     * Handles the success of adding an address.
     */
    const handleSuccess = useCallback(() => {
        handleOpenChange(false)
        onSuccess?.()
    }, [handleOpenChange, onSuccess])

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Address</DialogTitle>
                    <DialogDescription>Add a new address to your account.</DialogDescription>
                </DialogHeader>

                <AddAddressForm
                    trigger={isSubmitting => (
                        <DialogFooter>
                            <div className="w-full flex justify-end">
                                <Button type="submit" isLoading={isSubmitting}>
                                    Add Address
                                </Button>
                            </div>
                        </DialogFooter>
                    )}
                    onSubmit={handleAddAddress}
                    onSuccess={handleSuccess}
                />
            </DialogContent>

            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus />
                    Add Address
                </Button>
            </DialogTrigger>
        </Dialog>
    )
}
