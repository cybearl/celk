import { Button } from "@app/components/ui/Button"
import CopyToClipboard from "@app/components/ui/CopyToClipboard"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@app/components/ui/Dialog"
import Note from "@app/components/ui/Note"
import { decryptAddressPrivateKey } from "@app/queries/addresses"
import { DialogTrigger } from "@radix-ui/react-dialog"
import dedent from "dedent"
import { Loader2Icon } from "lucide-react"
import { type ReactNode, useCallback, useEffect, useState } from "react"

type PrivateKeyDialogProps = {
    children: ReactNode
    addressId: string
    addressName: string
}

export default function PrivateKeyDialog({ children, addressId, addressName }: PrivateKeyDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [privateKey, setPrivateKey] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    /**
     * Decrypts the private key for the given address ID.
     */
    const decryptPrivateKey = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        setPrivateKey(null)

        try {
            const { privateKey } = await decryptAddressPrivateKey(addressId)

            // Wait for a bit, just so the loading state don't flash briefly
            // which would just look like a bug...
            await new Promise(resolve => setTimeout(resolve, 500))

            setPrivateKey(privateKey)
        } catch {
            setError("Failed to retrieve the private key. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }, [addressId])

    // Fetches the decrypted private key from the server when the dialog opens.
    useEffect(() => {
        if (!isOpen) return
        decryptPrivateKey()
    }, [isOpen, decryptPrivateKey])

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="overflow-hidden">
                <DialogHeader className="w-0 min-w-full">
                    <DialogTitle className="truncate">Private Key: {addressName}</DialogTitle>
                    <DialogDescription>
                        Server-decrypted on demand, never transmitted in plaintext outside this session.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3">
                    <Note
                        icon="alert-triangle"
                        text={dedent`
                            This key grants full, irrevocable control over the wallet, treat it like a master password,
                            store it somewhere safe and never share it with anyone.
                        `}
                    />

                    <div className="min-h-10 rounded border border-border-active bg-foreground/5 px-3 py-2.5">
                        {isLoading && (
                            <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Loader2Icon className="size-3.5 animate-spin" />
                                Decrypting…
                            </span>
                        )}

                        {error && <span className="text-xs text-destructive">{error}</span>}

                        {privateKey && <span className="break-all text-sm">{privateKey}</span>}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                        Close
                    </Button>

                    <CopyToClipboard
                        buttonLabel="Copy Key"
                        text={privateKey}
                        successMessage="Private key copied to clipboard."
                    />
                </DialogFooter>
            </DialogContent>

            <DialogTrigger asChild>{children}</DialogTrigger>
        </Dialog>
    )
}
