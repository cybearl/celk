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
import { type ReactNode, useCallback, useState } from "react"

type ConfirmationDialogProps = {
    children: ReactNode
    title: string
    description: string
    confirmButtonText: string
    cancelButtonText: string
    onConfirm?: () => void
    onCancel?: () => void
}

export default function ConfirmationDialog({
    children,
    title,
    description,
    confirmButtonText,
    cancelButtonText,
    onConfirm,
    onCancel,
}: ConfirmationDialogProps) {
    const [isOpen, setIsOpen] = useState(false)

    /**
     * Closes the dialog and runs the `onConfirm` callback if provided.
     */
    const handleConfirm = useCallback(() => {
        setIsOpen(false)
        onConfirm?.()
    }, [onConfirm])

    /**
     * Closes the dialog and runs the `onCancel` callback if provided.
     */
    const handleCancel = useCallback(() => {
        setIsOpen(false)
        onCancel?.()
    }, [onCancel])

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        {cancelButtonText}
                    </Button>
                    <Button onClick={handleConfirm}>{confirmButtonText}</Button>
                </DialogFooter>
            </DialogContent>

            <DialogTrigger asChild>{children}</DialogTrigger>
        </Dialog>
    )
}
