import { useCallback, useRef } from "react"
import { useFocusRects } from "@fluentui/react"

export function useFeedTabStop() {
    const elementRef = useRef<HTMLElement>(null)
    // FocusZone handles navigation but does not enable v8's focus styling.
    useFocusRects(elementRef)
    const onPagesUpdated = useCallback(() => {
        const root = elementRef.current
        // Virtualized cells can mount after FocusZone initializes. Fluent UI v8
        // no longer updates their tab stops from key events outside the zone.
        if (!root) return
        const cells = root.querySelectorAll<HTMLElement>(
            '[data-is-focusable="true"]'
        )
        // Every card must also accept focus when the article reader closes.
        cells.forEach(cell => {
            if (!cell.hasAttribute("tabindex")) cell.tabIndex = -1
        })
        if (
            !root.querySelector('[data-is-focusable][tabindex="0"]') &&
            cells[0]
        )
            cells[0].tabIndex = 0
    }, [])

    return { elementRef, onPagesUpdated }
}
