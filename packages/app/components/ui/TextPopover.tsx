import { Popover, PopoverContent, PopoverTrigger } from "@app/components/ui/Popover"
import type { ReactNode } from "react"

type TextPopoverProps = {
    children?: ReactNode
    customContent?: ReactNode
}

export default function TextPopover({ children, customContent }: TextPopoverProps) {
    if (!children) return <span className="text-muted-foreground">N/A</span>

    return (
        <Popover>
            <PopoverTrigger className="max-w-48 truncate cursor-pointer underline decoration-dotted underline-offset-2">
                {children}
            </PopoverTrigger>
            <PopoverContent className="w-fit">{customContent ?? children}</PopoverContent>
        </Popover>
    )
}
