import type { ProgressProvider } from "@bprogress/next/pages"

/**
 * The main configuration for the BProgress loading bar.
 * @see https://github.com/imskyleen/bprogress/tree/main
 */
const B_PROGRESS_CONFIG: Parameters<typeof ProgressProvider>[0] = {
    height: "2px",
    color: "#fb5094",
    shallowRouting: true,
    options: {
        showSpinner: false,
    },
}

export default B_PROGRESS_CONFIG
