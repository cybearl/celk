import { Button } from "@app/components/ui/Button"
import ADDRESSES_CONFIG from "@app/config/addresses"
import { useCallback } from "react"

type TreeViewControlsProps = {
    minZoom: number
    zoom: number
    setZoom: (newZoom: number) => void
}

export default function TreeViewControls({ minZoom, zoom, setZoom }: TreeViewControlsProps) {
    const zoomIn = useCallback(() => {
        const newZoom = Math.min(ADDRESSES_CONFIG.treeView.zoom.max, zoom + ADDRESSES_CONFIG.treeView.zoom.step)
        setZoom(newZoom)
    }, [zoom, setZoom])

    const zoomOut = useCallback(() => {
        const newZoom = Math.max(minZoom, zoom - ADDRESSES_CONFIG.treeView.zoom.step)
        setZoom(newZoom)
    }, [zoom, setZoom, minZoom])

    //const zoomFit = useCallback(() => {
    //    const zoom = availableWidth / (maxCols * (cellWidth + ADDRESSES_CONFIG.treeView.cellGap))
    //    setZoom(Math.min(ADDRESSES_CONFIG.treeView.zoom.max, Math.max(ADDRESSES_CONFIG.treeView.zoom.min, zoom)))
    //}, [availableWidth, setZoom, maxCols, cellWidth])

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={zoomIn}>
                Zoom In
            </Button>
            <Button variant="outline" size="sm" onClick={zoomOut}>
                Zoom Out
            </Button>
            {/*<Button variant="outline" size="sm" onClick={zoomFit} disabled={!availableWidth}>
                Fit
            </Button>*/}

            <span className="text-sm text-muted-foreground tabular-nums">{Math.round(zoom * 100)}%</span>
        </div>
    )
}
