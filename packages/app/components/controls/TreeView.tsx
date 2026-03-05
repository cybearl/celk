import { Button } from "@app/components/ui/Button"
import ADDRESSES_CONFIG from "@app/config/addresses"
import { type RefObject, useCallback } from "react"

type TreeViewControlsProps = {
    zoom: number
    setZoom: (newZoom: number) => void
    wrappedCanvasRef: RefObject<HTMLDivElement | null>
}

export default function TreeViewControls({ zoom, setZoom, wrappedCanvasRef }: TreeViewControlsProps) {
    /**
     * Zoom in by multiplying the current zoom level by the step factor,
     * up to the maximum zoom level.
     */
    const zoomIn = useCallback(() => {
        const newZoom = Math.min(ADDRESSES_CONFIG.treeView.zoom.min, zoom * ADDRESSES_CONFIG.treeView.zoom.step)
        setZoom(newZoom)
    }, [zoom, setZoom])

    /**
     * Zoom out by dividing the current zoom level by the step factor,
     * down to the minimum zoom level.
     */
    const zoomOut = useCallback(() => {
        const newZoom = Math.max(ADDRESSES_CONFIG.treeView.zoom.max, zoom / ADDRESSES_CONFIG.treeView.zoom.step)
        setZoom(newZoom)
    }, [zoom, setZoom])

    /**
     * Zoom to fit the entire tree view within the available width of the canvas,
     * taking into account the number of columns, cell size, gap, and horizontal padding.
     */
    const zoomFit = useCallback(() => {
        const availableSpace = wrappedCanvasRef.current!.clientWidth - ADDRESSES_CONFIG.treeView.xPadding - 2

        const zoom =
            availableSpace /
            (ADDRESSES_CONFIG.treeView.gridCols *
                (ADDRESSES_CONFIG.treeView.cells.baseSize + ADDRESSES_CONFIG.treeView.cells.gap))

        setZoom(Math.min(ADDRESSES_CONFIG.treeView.zoom.max, Math.max(ADDRESSES_CONFIG.treeView.zoom.min, zoom)))
    }, [wrappedCanvasRef.current?.clientWidth, setZoom])

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={zoomIn}>
                Zoom In
            </Button>
            <Button variant="outline" size="sm" onClick={zoomOut}>
                Zoom Out
            </Button>
            <Button variant="outline" size="sm" onClick={zoomFit} disabled={!wrappedCanvasRef.current?.clientWidth}>
                Fit
            </Button>

            <span className="text-sm text-muted-foreground tabular-nums">{Math.round(zoom * 100)}%</span>
        </div>
    )
}
