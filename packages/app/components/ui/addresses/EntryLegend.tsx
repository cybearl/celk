import type { AddressEntry } from "@app/components/tabs/dashboard/TreeView"
import { invertHexColor } from "@app/lib/client/utils/addresses"
import { useMemo } from "react"

type AddressEntryLegendProps = {
    entry: AddressEntry
}

export default function AddressEntryLegend({ entry }: AddressEntryLegendProps) {
    const invertColor = useMemo(() => invertHexColor(entry.color), [entry.color])

    return (
        <div className="flex items-center gap-1.5 text-sm">
            <div className="flex justify-center items-center">
                <div className="h-3 w-0.5 shrink-0" style={{ backgroundColor: invertColor }} />
                <div className="h-3 w-2.5 shrink-0" style={{ backgroundColor: entry.color }} />
            </div>

            <span>{entry.name}</span>
            <span className="text-muted-foreground text-xs italic">
                ({entry.matchBytes ? `${entry.matchBytes.length}` : ""}/{entry.bytes!.length})
            </span>
        </div>
    )
}
