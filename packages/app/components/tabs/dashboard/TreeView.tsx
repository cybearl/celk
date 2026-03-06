import TreeViewControls from "@app/components/controls/TreeView"
import TreeViewTooltip, { type Tooltip } from "@app/components/tooltips/TreeView"
import ADDRESSES_CONFIG from "@app/config/addresses"
import type { AddressSelectModel, SerializedAddressSelectModel } from "@app/db/schema/address"
import { useAddresses } from "@app/hooks/api/useAddresses"
import { convertAddressToBytes, convertHexAddressToBytes } from "@app/lib/client/utils/addresses"
import ColorHash from "color-hash"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

/**
 * The type for an address entry prepared for visualization,
 * with pre-converted byte arrays and assigned colors.
 */
type AddressEntry = {
    name: string
    color: string
    bytes: Uint8Array | null
    matchBytes: Uint8Array | null
}

type TreeViewDashboardTabProps = {
    initialAddresses: SerializedAddressSelectModel[]
}

// Zoom=1 fills the container width exactly — can't zoom out below that.
const MIN_ZOOM = 1

export default function TreeViewDashboardTab({ initialAddresses }: TreeViewDashboardTabProps) {
    const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null)
    const [tooltip, setTooltip] = useState<Tooltip>(null)
    const [zoom, setZoom] = useState(MIN_ZOOM)

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const canvasContainerRef = useRef<HTMLDivElement>(null)

    const { data: addresses } = useAddresses(initialAddresses as unknown as AddressSelectModel[])
    const colorHash = useMemo(() => new ColorHash(), [])

    const entries = useMemo<AddressEntry[]>(() => {
        if (addresses) {
            return addresses
                .map(address => ({
                    name: address.name,
                    color: colorHash.hex(address.value),
                    bytes: convertAddressToBytes(address),
                    matchBytes: address.closestMatch ? convertHexAddressToBytes(address.closestMatch) : null,
                }))
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
     * All layout values derived from container size + zoom in one place.
     *
     * - cellWidth:   at zoom=1 fills the container width exactly, grows with zoom
     * - cellHeight:  always fills the container height, regardless of zoom
     * - canvasWidth: expands with zoom, triggering horizontal scroll in the container
     * - canvasHeight: fixed to container height
     */
    const layout = useMemo(() => {
        if (!containerSize) return null

        const { yPadding, gridRows } = ADDRESSES_CONFIG.treeView
        const availableHeight = containerSize.height - yPadding * 2

        const cellWidth = (containerSize.width / longestAddressByteLength) * zoom
        const cellHeight = availableHeight / gridRows
        const canvasWidth = cellWidth * longestAddressByteLength
        const canvasHeight = containerSize.height

        return { cellWidth, cellHeight, canvasWidth, canvasHeight, yPadding }
    }, [containerSize, zoom, longestAddressByteLength])

    const draw = useCallback(() => {
        if (!layout) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const { cellWidth, cellHeight, canvasWidth, canvasHeight, yPadding } = layout
        const { colors } = ADDRESSES_CONFIG.treeView

        canvas.width = canvasWidth
        canvas.height = canvasHeight

        // Background
        ctx.fillStyle = colors.background
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)

        const nodeX = (col: number) => col * cellWidth + cellWidth / 2
        const nodeY = (byteValue: number) => yPadding + byteValue * cellHeight + cellHeight / 2

        const lineWidth = Math.max(2, zoom * 2)
        const nodeRadius = Math.max(1, zoom * 4)

        const drawPath = (bytes: Uint8Array) => {
            for (let col = 0; col < bytes.length - 1; col++) {
                const x1 = nodeX(col)
                const y1 = nodeY(bytes[col])
                const x2 = nodeX(col + 1)
                const y2 = nodeY(bytes[col + 1])
                const mx = (x1 + x2) / 2

                ctx.beginPath()
                ctx.moveTo(x1, y1)
                ctx.bezierCurveTo(mx, y1, mx, y2, x2, y2)
                ctx.stroke()
            }

            for (let col = 0; col < bytes.length; col++) {
                ctx.beginPath()
                ctx.arc(nodeX(col), nodeY(bytes[col]), nodeRadius, 0, Math.PI * 2)
                ctx.fill()
            }
        }

        ctx.lineWidth = lineWidth

        // Closest-match branches (dim, drawn first so targets paint over)
        for (const { matchBytes, color } of entries) {
            if (!matchBytes) continue
            ctx.strokeStyle = color
            ctx.fillStyle = color
            drawPath(matchBytes)
        }

        // Target address branches (full color)
        for (const { bytes, color } of entries) {
            if (!bytes) continue
            ctx.strokeStyle = color
            ctx.fillStyle = color
            drawPath(bytes)
        }
    }, [layout, entries, zoom])

    useEffect(() => draw(), [draw])

    return (
        <div className="relative flex flex-col gap-4 h-0 min-h-full">
            <TreeViewControls minZoom={MIN_ZOOM} zoom={zoom} setZoom={setZoom} />

            {entries.length > 0 && (
                <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                    {entries.map(({ name, color, bytes, matchBytes }) => (
                        <div key={name} className="flex items-center gap-1.5 text-sm">
                            <div className="size-3 shrink-0" style={{ backgroundColor: color }} />
                            <span>{name}</span>
                            <span className="text-muted-foreground text-xs">
                                ({bytes!.length}B{matchBytes ? ` · match ${matchBytes.length}B` : ""})
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <div ref={canvasContainerRef} className="overflow-x-scroll overflow-y-hidden border border-border h-full">
                {entries.length === 0 ? (
                    <p className="p-8 text-center text-sm text-muted-foreground">
                        No addresses with decodable byte data. Add Ethereum addresses or Bitcoin addresses with
                        pre-encoding data to visualize them here.
                    </p>
                ) : (
                    <canvas
                        ref={canvasRef}
                        style={{ display: "block", cursor: "crosshair" }}
                        onMouseLeave={() => setTooltip(null)}
                    />
                )}
            </div>
            {/*
            <div className="absolute right-4 bottom-8 border border-border px-4 py-4 bg-background">
                <ul className="text-xs text-muted-foreground list-disc list-inside">
                    <li className="text-xs text-muted-foreground">
                        Each branch level is a byte position, Y position is the byte value (0x00–0xFF).
                    </li>
                    <li className="text-xs text-muted-foreground">
                        Bright branches are target addresses, dim branches are closest matches.
                    </li>
                    <li className="text-xs text-muted-foreground">Ctrl+scroll or use Zoom In/Out to navigate.</li>
                </ul>
            </div>*/}

            <TreeViewTooltip tooltip={tooltip} setTooltip={setTooltip} />
        </div>
    )
}
