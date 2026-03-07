import type ColorHash from "color-hash"

/**
 * The main configuration for the addresses.
 */
const ADDRESSES_CONFIG = {
    concatenationSize: 6,
    treeView: {
        gridRows: 256,
        cellGap: 6,
        yPadding: 48,
        noHighlightOpacity: 0.04,
        zoom: {
            min: 1,
            max: 4,
            step: 0.05, // zoom in/out by 5% each step
        },
        colors: {
            lightness: 0.6,
            saturation: 1,
        } satisfies ColorHash.ColorHashOptions,
        localStorageKeys: {
            latestHighlightedAddressListId: "latestHighlightedAddressListId",
        },
    },
}

export default ADDRESSES_CONFIG
