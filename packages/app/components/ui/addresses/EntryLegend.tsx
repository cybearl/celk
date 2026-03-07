import type { AddressEntry } from "@app/components/tabs/dashboard/TreeView"
import { invertHexColor } from "@app/lib/base/utils/miscellaneous"
import { cn } from "@app/lib/client/utils/styling"
import { useMemo } from "react"

type AddressEntryLegendProps = {
    entry: AddressEntry
    entryIndex: number
    isHighlighted: boolean
    onClick: (entryIndex: number) => void
}

export default function AddressEntryLegend({ entry, entryIndex, isHighlighted, onClick }: AddressEntryLegendProps) {
    const invertColor = useMemo(() => invertHexColor(entry.color), [entry.color])

    return (
        <button
            onClick={() => onClick(entryIndex)}
            className={cn(
                "flex items-center gap-1.5 text-xs border px-2.5 h-8 border-border",
                isHighlighted ? "bg-muted/60" : "hover:bg-muted/60",
            )}
        >
            <div className="flex justify-center items-center">
                <div className="h-3 w-1.5 shrink-0" style={{ backgroundColor: invertColor }} />
                <div className="h-3 w-1.5 shrink-0" style={{ backgroundColor: entry.color }} />
            </div>

            <span>{entry.name}</span>
            <span className="text-muted-foreground text-xs italic">
                ({entry.matchBytes ? `${entry.matchBytes.length}` : "0"}/{entry.bytes!.length})
            </span>
        </button>
    )
}
