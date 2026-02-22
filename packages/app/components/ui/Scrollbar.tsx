import { OverlayScrollbarsComponent } from "overlayscrollbars-react"
import type { ReactNode } from "react"

type ScrollbarProps = {
    children?: ReactNode
}

export default function Scrollbar({ children }: ScrollbarProps) {
    return (
        <OverlayScrollbarsComponent
            className="h-full w-full px-4"
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
