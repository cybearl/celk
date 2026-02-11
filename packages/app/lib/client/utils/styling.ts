import type { CSSDelay } from "@app/types/miscellaneous"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * An utility function to efficiently merge Tailwind CSS classes
 * without style conflicts.
 * @param inputs The Tailwind CSS classes to merge.
 * @returns The merged Tailwind CSS classes.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Converts a CSS delay string to a number in milliseconds.
 * @param delay The CSS delay string to convert (e.g. "1s", "500ms" or a number directly (in ms)).
 * @returns The delay in milliseconds.
 */
export function convertCssDelayToMs(delay: CSSDelay): number {
    if (typeof delay === "number") return delay

    const match = delay.match(/(\d+(\.\d+)?)(s|ms)/)
    if (!match) return 0

    const value = Number.parseFloat(match[1])
    const unit = match[3]

    return unit === "s" ? value * 1000 : value
}
