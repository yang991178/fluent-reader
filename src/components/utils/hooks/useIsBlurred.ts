import { useState, useEffect } from "react"

export interface AppWindowFocusChangeEvent
    extends CustomEvent<{ focused: boolean }> {
    type: "app-window-focus-change"
}

export const useIsBlurred = () => {
    const [blurred, setBlurred] = useState(false)
    useEffect(() => {
        setBlurred(!globalThis.utils.isFocused())
        const onFocusChange = (e: AppWindowFocusChangeEvent) => {
            setBlurred(!e.detail.focused)
        }
        globalThis.addEventListener("app-window-focus-change", onFocusChange)
        return () => {
            globalThis.removeEventListener(
                "app-window-focus-change",
                onFocusChange
            )
        }
    }, [])
    return blurred
}
