export function findValidDate(...values: unknown[]): Date | undefined {
    for (const value of values) {
        const date =
            value instanceof Date
                ? value
                : typeof value === "string" || typeof value === "number"
                ? new Date(value)
                : null
        if (date && Number.isFinite(date.getTime())) return date
    }
    return undefined
}

export function getValidDate(...values: unknown[]): Date {
    return findValidDate(...values) ?? new Date()
}
