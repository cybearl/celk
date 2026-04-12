import { Button } from "@app/components/ui/Button"
import toast from "@app/components/ui/Toast"
import { cn } from "@app/lib/client/utils/styling"
import { ClipboardCheckIcon, ClipboardIcon } from "lucide-react"
import { useCallback, useState } from "react"

type CopyToClipboardProps = {
    buttonLabel: string // In "icon" variant, used as screen reader label
    text?: string | null
    successMessage: string
    variant?: "default" | "icon"
}

export default function CopyToClipboard({
    buttonLabel,
    text,
    successMessage,
    variant = "default",
}: CopyToClipboardProps) {
    const [isCopied, setIsCopied] = useState(false)

    /**
     * Handles copying the text to the clipboard and showing a success message.
     */
    const handleCopy = useCallback(async () => {
        if (!text) return

        try {
            await navigator.clipboard.writeText(text)

            setIsCopied(true)
            toast.success(successMessage)

            setTimeout(() => setIsCopied(false), 2000)
        } catch {
            toast.error("An error occurred while copying the text.")
        }
    }, [successMessage, text])

    return (
        <Button
            onClick={handleCopy}
            disabled={!text || isCopied}
            size={variant === "icon" ? "slim" : "default"}
            variant={variant === "icon" ? "ghost" : "default"}
            disableAsyncLoading
        >
            {isCopied ? <ClipboardCheckIcon /> : <ClipboardIcon />}
            <span className={cn(variant === "icon" ? "sr-only" : "")}>{buttonLabel}</span>
        </Button>
    )
}
