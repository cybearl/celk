/**
 * The main configuration for the addresses.
 */
const ADDRESSES_CONFIG = {
    treeView: {
        gridCols: 256,
        xPadding: 40,
        yPadding: 22,
        zoom: {
            min: 0.15,
            max: 8,
            step: 1.25, // zoom in/out by 25% each step
        },
        cells: {
            baseSize: 6,
            gap: 1,
        },
        colors: {
            background: "#0f0f0f",
            emptyCell: "#1c1c1c",
            axisLabel: "#484848",
        },
        palette: [
            "hsl(336, 90%, 62%)", // pink  (primary)
            "hsl(124, 65%, 52%)", // green (success)
            "hsl(210, 80%, 62%)", // blue  (info)
            "hsl(45, 90%, 62%)", // yellow
            "hsl(270, 80%, 65%)", // purple
            "hsl(0, 80%, 62%)", // red   (danger)
            "hsl(180, 70%, 52%)", // cyan
            "hsl(30, 85%, 58%)", // orange
        ],
    },
}

export default ADDRESSES_CONFIG
