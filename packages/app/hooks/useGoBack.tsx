import { useRouter } from "next/router"
import { useCallback, useEffect, useState } from "react"

/**
 * Triggers a `router.back()` followed by a `router.push("/")` if a `setTimeout` ends up triggering
 * because the `router.back()` did not work.
 */
export default function useGoBack() {
    const router = useRouter()

    const [isTriggered, setIsTriggered] = useState(false)
    const [lastRoute, setLastRoute] = useState<string | null>(null)

    const onGoBack = useCallback(() => {
        if (isTriggered) return

        if (window.history?.length && window.history.length > 1) router.back()
        else router.push("/")

        setIsTriggered(true)
        setLastRoute(router.asPath)
    }, [isTriggered, router])

    useEffect(() => {
        if (!isTriggered) return

        const timeoutId = setTimeout(() => {
            if (router.asPath === lastRoute) router.push("/")
            setIsTriggered(false)
        }, 512)

        return () => clearTimeout(timeoutId)
    }, [isTriggered, lastRoute, router])

    return { onGoBack }
}
