import TreeViewControls from "@app/components/controls/TreeView"
import TreeViewTooltip, { type Tooltip } from "@app/components/tooltips/TreeView"
import ADDRESSES_CONFIG from "@app/config/addresses"
import type { AddressSelectModel, SerializedAddressSelectModel } from "@app/db/schema/address"
import { useAddresses } from "@app/hooks/api/useAddresses"
import { convertAddressToBytes, convertHexAddressToBytes } from "@app/lib/client/utils/addresses"
import { dimHslColor } from "@app/lib/client/utils/colors"
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

export default function TreeViewDashboardTab({ initialAddresses }: TreeViewDashboardTabProps) {
    const [tooltip, setTooltip] = useState<Tooltip>(null)
    const [zoom, setZoom] = useState(1)

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const wrappedCanvasRef = useRef<HTMLDivElement>(null)

    const { data: addresses } = useAddresses(initialAddresses as unknown as AddressSelectModel[])

    const entries = useMemo<AddressEntry[]>(() => {
        if (addresses) {
            return addresses
                .map((address, i) => ({
                    name: address.name,
                    color: ADDRESSES_CONFIG.treeView.palette[i % ADDRESSES_CONFIG.treeView.palette.length],
                    bytes: convertAddressToBytes(address),
                    matchBytes: address.closestMatch ? convertHexAddressToBytes(address.closestMatch) : null,
                }))
                .filter(entry => entry.bytes !== null)
        }

        return []
    }, [addresses])

    /**
     * Calculate the maximum number of byte rows needed to display all addresses,
     * based on the longest byte array among the entries.
     */
    const maxRows = useMemo(() => Math.max(1, ...entries.map(entry => entry.bytes!.length)), [entries])

    /**
     * Get the width of a cell depending on the
     */

    /**
     * The main draw function that renders the tree view onto the canvas.
     */
    const draw = useCallback(() => {
        if (!wrappedCanvasRef.current?.clientWidth || !wrappedCanvasRef.current?.clientHeight) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        canvas.width = wrappedCanvasRef.current.clientWidth * 4
        canvas.height = wrappedCanvasRef.current.clientHeight

        // Background
        ctx.fillStyle = ADDRESSES_CONFIG.treeView.colors.background
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Empty cell grid
        ctx.fillStyle = ADDRESSES_CONFIG.treeView.colors.emptyCell
        for (let r = 0; r < maxRows; r++) {
            for (let col = 0; col < ADDRESSES_CONFIG.treeView.gridCols; col++) {
                ctx.fillRect(ADDRESSES_CONFIG.treeView.xPadding + col, ADDRESSES_CONFIG.treeView.yPadding + r, 8, 8)
            }
        }

        // Labels
        const fontFamily = getComputedStyle(document.body).fontFamily
        ctx.font = `${9}px ${fontFamily}`
    }, [])

    // Redraw whenever entries, maxRows, or zoom change
    useEffect(() => draw(), [draw])

    return (
        <div className="relative flex flex-col gap-4 h-0 min-h-full">
            <TreeViewControls zoom={zoom} setZoom={setZoom} wrappedCanvasRef={wrappedCanvasRef} />

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

            <div ref={wrappedCanvasRef} className="overflow-x-auto overflow-y-hidden border border-border h-full">
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

            <div className="absolute right-4 bottom-8 border border-border px-4 py-4 bg-background">
                <ul className="text-xs text-muted-foreground list-disc list-inside">
                    <li className="text-xs text-muted-foreground">
                        Each row is a byte position, each column is a byte value (0-255).
                    </li>
                    <li className="text-xs text-muted-foreground">
                        Bright cells are target addresses, dim cells are closest matches.
                    </li>
                    <li className="text-xs text-muted-foreground">Ctrl+scroll or use Zoom In/Out to navigate.</li>
                </ul>
            </div>

            <TreeViewTooltip tooltip={tooltip} setTooltip={setTooltip} />
        </div>
    )
}

//// Empty cell grid
//ctx.fillStyle = "#1c1c1c"
//for (let r = 0; r < maxRows; r++) {
//    for (let col = 0; col < ADDRESSES_CONFIG.treeView.gridCols; col++) {
//        ctx.fillRect(
//            ADDRESSES_CONFIG.treeView.xPadding + col * stride,
//            ADDRESSES_CONFIG.treeView.yPadding + r * stride,
//            cs,
//            cs,
//        )
//    }
//}

//// Closest-match cells (dim background layer, drawn first so targets paint over)
//for (const { matchBytes, color } of entries) {
//    if (!matchBytes) continue
//    ctx.fillStyle = dimHslColor(color)
//    for (let r = 0; r < matchBytes.length; r++) {
//        ctx.fillRect(
//            ADDRESSES_CONFIG.treeView.xPadding + matchBytes[r] * stride,
//            ADDRESSES_CONFIG.treeView.yPadding + r * stride,
//            cs,
//            cs,
//        )
//    }
//}

//// Target address cells (bright foreground layer)
//for (const { bytes, color } of entries) {
//    ctx.fillStyle = color
//    for (let r = 0; r < bytes!.length; r++) {
//        ctx.fillRect(
//            ADDRESSES_CONFIG.treeView.xPadding + bytes![r] * stride,
//            ADDRESSES_CONFIG.treeView.yPadding + r * stride,
//            cs,
//            cs,
//        )
//    }
//}

//// ── Axis labels ──────────────────────────────────────────────────────

//const fs = Math.max(9, Math.min(11, cs + 2))
//ctx.font = `${fs}px monospace`
//ctx.fillStyle = "#484848"

//// Y-axis: byte row index (skip labels that would overlap)
//const rowStep = Math.max(1, Math.ceil((fs + 2) / stride))
//ctx.textAlign = "right"

//for (let r = 0; r < maxRows; r += rowStep) {
//    ctx.fillText(
//        r.toString(),
//        ADDRESSES_CONFIG.treeView.xPadding - 4,
//        ADDRESSES_CONFIG.treeView.yPadding + r * stride + cs / 2 + fs / 3,
//    )
//}

//// X-axis: hex value every 16 cols (or wider if cells are tiny)
//ctx.textAlign = "left"

//const colStep = Math.max(16, Math.ceil(28 / (stride * 16)) * 16)

//for (let col = 0; col < ADDRESSES_CONFIG.treeView.gridCols; col += colStep) {
//    ctx.fillText(
//        col.toString(16).padStart(2, "0").toUpperCase(),
//        ADDRESSES_CONFIG.treeView.xPadding + col * stride,
//        ADDRESSES_CONFIG.treeView.yPadding - 4,
//    )
//}

// ── Auto-fit zoom to container width ─────────────────────────────────────
//useEffect(() => {
//    const el = wrapRef.current
//    if (!el) return
//    const fit = () => {
//        const available = el.clientWidth - PAD_L - 2 // -2 for border
//        setZoom(Math.max(0.15, Math.min(1.5, available / (GRID_COLS * (CELL_BASE + GAP)))))
//    }
//    fit()
//    const ro = new ResizeObserver(fit)
//    ro.observe(el)
//    return () => ro.disconnect()
//}, [])

// ── Zoom controls ─────────────────────────────────────────────────────────
//const onWheel = useCallback((e: React.WheelEvent) => {
//    if (!e.ctrlKey && !e.metaKey) return
//    e.preventDefault()
//    setZoom(z => Math.max(0.15, Math.min(8, z * (e.deltaY < 0 ? 1.15 : 1 / 1.15))))
//}, [])

// ── Tooltip on hover ──────────────────────────────────────────────────────
//const onMouseMove = useCallback(
//    (e: React.MouseEvent<HTMLCanvasElement>) => {
//        const canvas = canvasRef.current
//        if (!canvas) return
//        const rect = canvas.getBoundingClientRect()
//        const cs = Math.max(1, CELL_BASE * zoom)
//        const stride = cs + GAP
//        const col = Math.floor((e.clientX - rect.left - PAD_L) / stride)
//        const row = Math.floor((e.clientY - rect.top - PAD_T) / stride)

//        if (col < 0 || col >= GRID_COLS || row < 0 || row >= maxRows) {
//            setTooltip(null)
//            return
//        }

//        const hex = `0x${col.toString(16).padStart(2, "0").toUpperCase()}`

//        for (const { name, bytes, matchBytes } of entries) {
//            if (row < bytes.length && bytes[row] === col) {
//                setTooltip({
//                    screenX: e.clientX,
//                    screenY: e.clientY,
//                    label: `${name}  ·  byte ${row}: ${hex} (${col})`,
//                })
//                return
//            }
//            if (matchBytes && row < matchBytes.length && matchBytes[row] === col) {
//                setTooltip({
//                    screenX: e.clientX,
//                    screenY: e.clientY,
//                    label: `${name} (closest match)  ·  byte ${row}: ${hex} (${col})`,
//                })
//                return
//            }
//        }
//        setTooltip(null)
//    },
//    [entries, maxRows, zoom],
//)
