import { cn } from "@app/lib/client/utils/styling"
import { OverlayScrollbarsComponent } from "overlayscrollbars-react"
import type { ReactNode } from "react"

type ScrollbarProps = {
    className?: string
    children?: ReactNode
}

export default function Scrollbar({ className, children }: ScrollbarProps) {
    return (
        <OverlayScrollbarsComponent
            className={cn("h-full w-full", className)}
            defer
            options={{
                scrollbars: {
                    theme: "scrollbar-main",
                    autoHide: "never",
                    clickScroll: true,
                },
            }}
            onDragStart={e => e.preventDefault()}
        >
            {children ?? <div className="h-full w-full" />}
        </OverlayScrollbarsComponent>
    )
}
