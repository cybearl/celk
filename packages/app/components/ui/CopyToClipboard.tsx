import { Button } from "@app/components/ui/Button"
import toast from "@app/components/ui/Toast"
import { CopyIcon } from "lucide-react"

type CopyToClipboardProps = {
    text: string
    successMessage: string
}

export default function CopyToClipboard({ text, successMessage }: CopyToClipboardProps) {
    const handleCopy = () => {
        try {
            navigator.clipboard.writeText(text)
            toast.info(successMessage)
        } catch {
            toast.error("An error occurred while copying the text.")
        }
    }

    return (
        <Button onClick={handleCopy} size="slim" variant="ghost">
            <CopyIcon />
        </Button>
    )
}
