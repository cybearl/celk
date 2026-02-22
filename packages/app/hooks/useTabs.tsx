import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

/**
 * A hook to manage tabs with URL search parameters or internal state.
 *
 * Note: The main `<Tabs />` component should be set as controlled, meaning that
 * instead of using `initialTab` as a default value, `currentTab` should be passed
 * via the `value` prop.
 * @param tabs The tabs enum or object.
 * @param defaultTab The default tab to use if none is specified in the URL.
 * @param mode The mode to use for managing tabs, either "url" or "state" (optional, defaults to `url`).
 * @param key The key to use for the URL search parameter (optional, defaults to `tab`).
 * @returns An object containing the initial tab and a function to handle tab changes.
 */
export default function useTabs<T extends Record<string, string>>(
    tabs: T,
    defaultTab: T[keyof T],
    mode: "url" | "state" = "url",
    key = "tab",
) {
    const searchParams = useSearchParams()

    const initialTab = useMemo(() => {
        if (mode === "state") return defaultTab

        const tabParam = searchParams.get(key)
        if (tabParam && Object.values(tabs).includes(tabParam as T[keyof T])) {
            return tabParam as T[keyof T]
        }

        return defaultTab
    }, [searchParams, tabs, defaultTab, mode, key])

    const [currentTab, setCurrentTab] = useState(initialTab)

    /**
     * Handles tab changes by updating the URL search parameters.
     */
    const onTabChange = useCallback(
        (tab: T[keyof T]) => {
            // Disable URL updates in state mode
            if (mode === "state") return

            const params = new URLSearchParams(Array.from(searchParams.entries()))
            params.set(key, tab)

            window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`)

            setCurrentTab(tab)
        },
        [searchParams, mode, key],
    )

    // Ensure the URL is in sync with the initial tab on mount
    useEffect(() => onTabChange(initialTab), [initialTab, onTabChange])

    return { initialTab, currentTab, onTabChange }
}
