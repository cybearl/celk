/**
 * The main configuration for the addresses.
 */
const ADDRESSES_CONFIG = {
    treeView: {
        gridRows: 256,
        cellGap: 6,
        yPadding: 24,
        zoom: {
            max: 4,
            step: 0.05, // zoom in/out by 5% each step
        },
        colors: {
            background: "#0f0f0f",
            emptyCell: "#1c1c1c",
            axisLabel: "#484848",
        },
    },
}

export default ADDRESSES_CONFIG
