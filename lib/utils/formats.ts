/**
 * Insert a string into another string at a specific index.
 * @param str The string to insert into.
 * @param index The index to insert the string at.
 * @param value The string to insert.
 * @returns The new string.
 */
export function strInsert(str: string, index: number, value: string): string {
    return str.substring(0, index) + value + str.substring(index)
}

/**
 * Format a number with an attached unit + an optional time unit.
 *
 * **Note:** The time unit can be set to null to only display the unit.
 * @param num The number to format.
 * @param unit The unit to use (optional, defaults to "Op").
 * @param timeUnit The time unit to use (optional, defaults to "s").
 * @param padding The padding to use (optional, defaults to 12).
 * @param addSpaceBeforeUnit Whether to add a space before the unit (optional, defaults to true).
 * @returns The formatted string.
 */
export function formatUnit(
    num: number,
    unit: string | null = "Op",
    timeUnit: string | null = "s",
    padding = 12,
    addSpaceBeforeUnit = true
): string {
    let strUnit: string

    if (typeof unit === "string" && typeof timeUnit === "string") {
        strUnit = `${unit}/${timeUnit}`
    } else if (typeof unit === "string") {
        strUnit = unit
    } else {
        strUnit = ""
    }

    // Add a space before the unit if needed
    const spaceOrNot = addSpaceBeforeUnit ? " " : ""

    // Y = yotta
    if (num >= Math.pow(10, 24)) {
        return `${(num / Math.pow(10, 24)).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}${spaceOrNot}Y${strUnit}`.padStart(padding, " ")
    }

    // E = exa
    if (num >= Math.pow(10, 18)) {
        return `${(num / Math.pow(10, 18)).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}${spaceOrNot}E${strUnit}`.padStart(padding, " ")
    }

    // P = peta
    if (num >= Math.pow(10, 15)) {
        return `${(num / Math.pow(10, 15)).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}${spaceOrNot}P${strUnit}`.padStart(padding, " ")
    }

    // T = tera
    if (num >= Math.pow(10, 12)) {
        return `${(num / Math.pow(10, 12)).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}${spaceOrNot}T${strUnit}`.padStart(padding, " ")
    }

    // G = giga
    if (num >= Math.pow(10, 9)) {
        return `${(num / Math.pow(10, 9)).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}${spaceOrNot}G${strUnit}`.padStart(padding, " ")
    }

    // M = mega
    if (num >= Math.pow(10, 6)) {
        return `${(num / Math.pow(10, 6)).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}${spaceOrNot}M${strUnit}`.padStart(padding, " ")
    }

    // k = kilo
    if (num >= Math.pow(10, 3)) {
        return `${(num / Math.pow(10, 3)).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}${spaceOrNot}k${strUnit}`.padStart(padding, " ")
    }

    return `${num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}${spaceOrNot}${strUnit}`.padStart(padding, " ")
}

/**
 * Format a high-resolution time, into a responsive string with the en-US locale format.
 * @param hrtime The hrtime in nanoseconds.
 * @param padding The padding to use (optional, defaults to 8).
 * @returns The formatted string.
 */
export function formatHRTime(hrtime: bigint | number, padding = 8): string {
    // Hours
    if (hrtime >= 3600000000000000n) {
        return `${(Number(hrtime) / 3600000000000000).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}h`.padStart(padding, " ")
    }

    // Minutes
    if (hrtime >= 60000000000n) {
        return `${(Number(hrtime) / 60000000000).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}m`.padStart(padding, " ")
    }

    // Seconds
    if (hrtime >= 1000000000n) {
        return `${(Number(hrtime) / 1000000000).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}s`.padStart(padding, " ")
    }

    // Milliseconds
    if (hrtime >= 1000000n) {
        return `${(Number(hrtime) / 1000000).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}ms`.padStart(padding, " ")
    }

    // Microseconds
    if (hrtime >= 1000n) {
        return `${(Number(hrtime) / 1000).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}µs`.padStart(padding, " ")
    }

    // Nanoseconds
    return `${hrtime.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}ns`.padStart(padding, " ")
}

/**
 * Format a time in milliseconds into a responsive string with the en-US locale format.
 * @param time The time in milliseconds.
 * @param padding The padding to use (optional, defaults to 10).
 * @returns The formatted string.
 */
export function formatTime(time: number, padding = 10): string {
    // Hours
    if (time >= 3600000) {
        return `${(time / 3600000).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}h`.padStart(padding, " ")
    }

    // Minutes
    if (time >= 60000) {
        return `${(time / 60000).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}m`.padStart(padding, " ")
    }

    // Seconds
    if (time >= 1000) {
        return `${(time / 1000).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}s`.padStart(padding, " ")
    }

    // Milliseconds
    return `${time.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}ms`.padStart(padding, " ")
}

/**
 * Format a percentage with the en-US locale format.
 * @param percentage The percentage to format.
 * @param padding The padding to use (optional, defaults to 7).
 * @returns The formatted string.
 */
export function formatPercentage(percentage: number, padding = 7): string {
    return `${percentage.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}%`.padStart(padding, " ")
}
