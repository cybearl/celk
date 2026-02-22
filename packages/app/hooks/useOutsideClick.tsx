import { type RefObject, useEffect } from "react"

/**
 * Hook that triggers a callback when a click is detected outside the referenced element.
 * @param ref The ref of the element to detect outside clicks for.
 * @param callback The callback to trigger on outside click.
 */
export function useOutsideClick(ref: RefObject<HTMLElement | null>, callback: () => void) {
    useEffect(() => {
        const onClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) callback()
        }

        document.addEventListener("mousedown", onClickOutside)
        return () => document.removeEventListener("mousedown", onClickOutside)
    }, [ref, callback])
}
