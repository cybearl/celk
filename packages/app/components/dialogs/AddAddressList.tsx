import AddAddressListForm, { type AddAddressListFormData } from "@app/components/forms/AddAddressList"
import { Button } from "@app/components/ui/Button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@app/components/ui/Dialog"
import type { AddressSelectModel } from "@app/db/schema/address"
import type { AddressListSelectModel } from "@app/db/schema/addressList"
import type { DynamicConfigSelectModel } from "@app/db/schema/dynamicConfig"
import { createAddressList } from "@app/queries/addressLists"
import { DialogTrigger } from "@radix-ui/react-dialog"
import { TRPCClientError } from "@trpc/client"
import { ScrollIcon } from "lucide-react"
import { useCallback, useState } from "react"

type AddAddressListDialogProps = {
    dynamicConfig: DynamicConfigSelectModel | null
    addresses: AddressSelectModel[] | null
    addressLists: AddressListSelectModel[] | null
    onSuccess?: () => void
}

export default function AddAddressListDialog({
    dynamicConfig,
    addresses,
    addressLists,
    onSuccess,
}: AddAddressListDialogProps) {
    const [isOpen, setIsOpen] = useState(false)

    /**
     * Handle the change of the dialog open state.
     */
    const handleOpenChange = useCallback((isOpen: boolean) => {
        setIsOpen(isOpen)
    }, [])

    /**
     * Handle the submission of the add address list form.
     * @param data The form data containing the name of the address list and the
     * selected address IDs to be added to the new list.
     */
    const handleAddAddressList = useCallback(
        async (data: AddAddressListFormData) => {
            if (addressLists?.some(l => l.name.toLowerCase() === data.name.toLowerCase())) {
                return {
                    error: {
                        message: "An address list with this name already exists.",
                    },
                }
            }

            try {
                await createAddressList(data)
                return {}
            } catch (error) {
                if (error instanceof TRPCClientError) {
                    return {
                        error: {
                            message: error.message,
                        },
                    }
                }

                return {
                    error: {
                        message: "An error occurred while creating the list, please try again.",
                    },
                }
            }
        },
        [addressLists],
    )

    const handleSuccess = useCallback(() => {
        handleOpenChange(false)
        onSuccess?.()
    }, [handleOpenChange, onSuccess])

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Address List</DialogTitle>
                    <DialogDescription>Create a named list and select addresses to include.</DialogDescription>
                </DialogHeader>

                <AddAddressListForm
                    dynamicConfig={dynamicConfig}
                    addresses={addresses}
                    trigger={isSubmitting => (
                        <DialogFooter>
                            <div className="w-full flex justify-end">
                                <Button type="submit" isLoading={isSubmitting}>
                                    Create List
                                </Button>
                            </div>
                        </DialogFooter>
                    )}
                    onSubmit={handleAddAddressList}
                    onSuccess={handleSuccess}
                />
            </DialogContent>

            <DialogTrigger asChild>
                <Button size="sm">
                    <ScrollIcon />
                    Create List
                </Button>
            </DialogTrigger>
        </Dialog>
    )
}
