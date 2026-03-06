import { cn } from "@app/lib/client/utils/styling"
import { useMemo } from "react"

type EmptyProps = {
    title: string
    size?: "sm" | "md" | "lg"
}

export default function Empty({ title, size = "md" }: EmptyProps) {
    const padding = useMemo(() => {
        switch (size) {
            case "sm":
                return "px-4 py-2"
            case "lg":
                return "p-6"
            default:
                return "p-4"
        }
    }, [size])

    return (
        <div className={cn("bg-accent/20 border border-foreground", padding)}>
            <p>{title}</p>
        </div>
    )
}
