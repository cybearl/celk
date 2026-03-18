import { cn } from "@app/lib/client/utils/styling"

type FlashProps = {
    value: string
    className?: string
}

export default function Flash({ value, className }: FlashProps) {
    return (
        <span key={value} className={cn("animate-flash", className)}>
            {value}
        </span>
    )
}
