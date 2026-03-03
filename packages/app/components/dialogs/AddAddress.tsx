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
import { DialogTrigger } from "@radix-ui/react-dialog"
import { useCallback, useState } from "react"

type AddAddressDialogProps = {
    onAddAddress: (data: AddAddressFormData) => Promise<{ error?: { message: string } }>
    onSuccess?: () => void
}

export default function AddAddressDialog({ onAddAddress, onSuccess }: AddAddressDialogProps) {
    const [isOpen, setIsOpen] = useState(false)

    const handleOpenChange = useCallback((open: boolean) => {
        setIsOpen(open)
    }, [])

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
                    onSubmit={onAddAddress}
                    onSuccess={handleSuccess}
                />
            </DialogContent>

            <DialogTrigger asChild>
                <Button>Add Address</Button>
            </DialogTrigger>
        </Dialog>
    )
}
