import TreeViewControls from "@app/components/controls/TreeView"
import AddressEntryLegend from "@app/components/ui/addresses/EntryLegend"
import { Button } from "@app/components/ui/Button"
import Empty from "@app/components/ui/Empty"
import Scrollbar from "@app/components/ui/Scrollbar"
import ADDRESSES_CONFIG from "@app/config/addresses"
import type { AddressSelectModel } from "@app/db/schema/address"
import { convertAddressToBytes, convertHexAddressToBytes } from "@app/lib/base/utils/addresses"
import { extractNumberFromLocalStorage } from "@app/lib/base/utils/localStorage"
import { applyHexColorOpacity, invertHexColor } from "@app/lib/base/utils/miscellaneous"
import ColorHash from "color-hash"
import { XIcon } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

/**
 * The type for an address entry prepared for visualization,
 * with pre-converted byte arrays and assigned colors.
 */
export type AddressEntry = {
    name: string
    color: string
    bytes: Uint8Array | null
    matchBytes?: Uint8Array | null
}

type TreeViewDashboardTabProps = {
    addresses: AddressSelectModel[] | null
}

export default function TreeViewDashboardTab({ addresses }: TreeViewDashboardTabProps) {
    const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null)
    const [zoom, setZoom] = useState(ADDRESSES_CONFIG.treeView.zoom.min)
    const [highlightedEntryIndex, setHighlightedEntryIndex] = useState<number | null>(null)

    useEffect(() => {
        setHighlightedEntryIndex(
            extractNumberFromLocalStorage(ADDRESSES_CONFIG.treeView.localStorageKeys.latestHighlightedAddressListId),
        )
    }, [])

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const canvasContainerRef = useRef<HTMLDivElement>(null)

    const colorHash = useMemo(() => new ColorHash(ADDRESSES_CONFIG.treeView.colors), [])

    const entries = useMemo<AddressEntry[]>(() => {
        if (addresses) {
            return addresses
                .map(address => {
                    const bytes = convertAddressToBytes(address)

                    return {
                        name: address.name,
                        color: colorHash.hex(address.value),
                        bytes: convertAddressToBytes(address),

                        // Copy the bytes Uint8Array from 0 to closestMatch (exclusive), if closestMatch is defined and valid
                        matchBytes:
                            bytes &&
                            address.closestMatch !== null &&
                            address.closestMatch > 0 &&
                            address.closestMatch <= convertHexAddressToBytes(address.value).length
                                ? bytes.slice(0, address.closestMatch)
                                : null,
                    }
                })
                .filter(entry => entry.bytes !== null)
        }

        return []
    }, [addresses, colorHash])

    const longestAddressByteLength = useMemo(() => Math.max(1, ...entries.map(entry => entry.bytes!.length)), [entries])

    useEffect(() => {
        const element = canvasContainerRef.current
        if (!element) return

        const observer = new ResizeObserver(([entry]) => {
            setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height })
        })

        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    /**
     * All layout values derived from container size + zoom in one place:
     * - `cellWidth`: at zoom=1 fills the container width exactly, grows with zoom.
     * - `cellHeight`: always fills the container height, regardless of zoom.
     * - `canvasWidth`: expands with zoom, triggering horizontal scroll in the container.
     * - `canvasHeight`: fixed to container height.
     */
    const layout = useMemo(() => {
        if (!containerSize) return null

        const availableHeight = containerSize.height - ADDRESSES_CONFIG.treeView.yPadding * 2

        const cellWidth = (containerSize.width / longestAddressByteLength) * zoom
        const cellHeight = availableHeight / ADDRESSES_CONFIG.treeView.gridRows
        const canvasWidth = cellWidth * longestAddressByteLength
        const canvasHeight = containerSize.height

        return {
            cellWidth,
            cellHeight,
            canvasWidth,
            canvasHeight,
        }
    }, [containerSize, zoom, longestAddressByteLength])

    /**
     * Gets the x coordinate of a node based on its column index.
     * @param col The byte position (column index).
     * @return The x coordinate for the node center.
     */
    const getNodeX = useCallback(
        (col: number) => {
            if (!layout) return 0
            return col * layout.cellWidth + layout.cellWidth / 2
        },
        [layout],
    )

    /**
     * Gets the y coordinate of a node based on its byte value.
     * @param byteValue The byte value (0-255).
     * @return The y coordinate for the node center.
     */
    const getNodeY = useCallback(
        (byteValue: number) => {
            if (!layout) return 0
            return ADDRESSES_CONFIG.treeView.yPadding + byteValue * layout.cellHeight + layout.cellHeight / 2
        },
        [layout],
    )

    /**
     * The main drawing function that renders the tree view on the canvas.
     */
    const draw = useCallback(() => {
        if (!layout) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        canvas.width = layout.canvasWidth
        canvas.height = layout.canvasHeight

        const lineWidth = Math.max(2, zoom * 2)
        const nodeRadius = Math.max(1, zoom * 4)

        const drawPath = (bytes: Uint8Array) => {
            for (let col = 0; col < bytes.length - 1; col++) {
                const x1 = getNodeX(col)
                const y1 = getNodeY(bytes[col])
                const x2 = getNodeX(col + 1)
                const y2 = getNodeY(bytes[col + 1])
                const mx = (x1 + x2) / 2

                ctx.beginPath()
                ctx.moveTo(x1, y1)
                ctx.bezierCurveTo(mx, y1, mx, y2, x2, y2)
                ctx.stroke()
            }

            for (let col = 0; col < bytes.length; col++) {
                ctx.beginPath()
                ctx.arc(getNodeX(col), getNodeY(bytes[col]), nodeRadius, 0, Math.PI * 2)
                ctx.fill()
            }
        }

        ctx.lineWidth = lineWidth

        // Target address branches
        for (const [index, { bytes, color }] of Object.entries(entries)) {
            if (!bytes) continue

            if (highlightedEntryIndex !== null) {
                if (parseInt(index, 10) === highlightedEntryIndex) {
                    ctx.strokeStyle = color
                    ctx.fillStyle = color
                } else {
                    const invertColorWithHighlight = applyHexColorOpacity(
                        color,
                        ADDRESSES_CONFIG.treeView.noHighlightOpacity,
                    )

                    ctx.strokeStyle = invertColorWithHighlight
                    ctx.fillStyle = invertColorWithHighlight
                }
            } else {
                ctx.strokeStyle = color
                ctx.fillStyle = color
            }

            drawPath(bytes)
        }

        // Closest-match branches
        for (const [index, { matchBytes, color }] of Object.entries(entries)) {
            if (!matchBytes) continue
            const invert = invertHexColor(color)

            if (highlightedEntryIndex !== null) {
                if (parseInt(index, 10) === highlightedEntryIndex) {
                    ctx.strokeStyle = invert
                    ctx.fillStyle = invert
                } else {
                    const invertColorWithHighlight = applyHexColorOpacity(
                        invert,
                        ADDRESSES_CONFIG.treeView.noHighlightOpacity,
                    )

                    ctx.strokeStyle = invertColorWithHighlight
                    ctx.fillStyle = invertColorWithHighlight
                }
            } else {
                ctx.strokeStyle = invert
                ctx.fillStyle = invert
            }

            drawPath(matchBytes)
        }
    }, [layout, entries, zoom, getNodeX, getNodeY, highlightedEntryIndex])

    useEffect(() => draw(), [draw])

    /**
     * Handle highlighting an entry when its legend item is clicked.
     * @param index The index of the entry to highlight, or null to clear highlighting.
     */
    const handleHighlightEntry = (index: number | null) => {
        setHighlightedEntryIndex(index)
        if (index !== null) {
            localStorage.setItem(
                ADDRESSES_CONFIG.treeView.localStorageKeys.latestHighlightedAddressListId,
                String(index),
            )
        } else {
            localStorage.removeItem(ADDRESSES_CONFIG.treeView.localStorageKeys.latestHighlightedAddressListId)
        }
    }

    if (entries.length < 1) {
        return (
            <div className="h-full flex justify-center items-center">
                <Empty title="No addresses with decodable byte data." />
            </div>
        )
    }

    return (
        <div className="relative flex flex-col gap-4 h-0 min-h-full">
            <TreeViewControls zoom={zoom} setZoom={setZoom} />

            <div ref={canvasContainerRef} className="h-[90%] border border-border bg-black/30 pb-0">
                <Scrollbar>
                    <canvas
                        ref={canvasRef}
                        style={{
                            display: "block",
                            cursor: "crosshair",
                            width: layout?.canvasWidth ?? 0,
                            height: layout?.canvasHeight ?? 0,
                        }}
                    />
                </Scrollbar>
            </div>

            {entries.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    <Button
                        variant="outline"
                        className="size-8 border-border"
                        size="icon"
                        onClick={() => handleHighlightEntry(null)}
                    >
                        <XIcon />
                    </Button>

                    {entries.map((entry, index) => (
                        <AddressEntryLegend
                            key={entry.name}
                            entry={entry}
                            entryIndex={index}
                            isHighlighted={highlightedEntryIndex === index}
                            onClick={handleHighlightEntry}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
