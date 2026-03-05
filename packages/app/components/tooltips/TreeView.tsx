/**
 * The type for the tooltip state, containing the screen coordinates and label to display.
 */
export type Tooltip = {
    screenX: number
    screenY: number
    label: string
} | null

type TreeViewTooltipProps = {
    tooltip: Tooltip
    setTooltip: (tooltip: Tooltip) => void
}

export default function TreeViewTooltip({ tooltip, setTooltip }: TreeViewTooltipProps) {
    if (!tooltip) return null

    return (
        <div
            className="fixed z-50 pointer-events-none px-2 py-1 text-xs rounded border border-border bg-popover text-popover-foreground shadow"
            style={{ left: tooltip.screenX + 14, top: tooltip.screenY - 10 }}
        >
            {tooltip.label}
        </div>
    )
}
