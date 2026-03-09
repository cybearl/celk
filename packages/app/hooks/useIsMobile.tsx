import { useEffect, useState } from "react"

/**
 * The breakpoint (in pixels) below which the device is considered a mobile device.
 */
const MOBILE_BREAKPOINT = 768

/**
 * A custom React hook that determines if the current device is a mobile device based on the window width.
 * @returns A boolean indicating if the device is mobile.
 */
export function useIsMobile() {
    const [isMobile, setIsMobile] = useState<boolean | undefined>()

    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

        const handleChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

        mql.addEventListener("change", handleChange)
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
        return () => mql.removeEventListener("change", handleChange)
    }, [])

    return !!isMobile
}
