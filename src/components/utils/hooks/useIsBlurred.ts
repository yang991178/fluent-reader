import { useState, useEffect } from "react"

export const useIsBlurred = () => {
    const [blurred, setBlurred] = useState(false)
    useEffect(() => {
        setBlurred(!globalThis.utils.isFocused())
        const onFocus = () => setBlurred(false)
        const onBlur = () => setBlurred(true)
        window.addEventListener("focus", onFocus)
        window.addEventListener("blur", onBlur)
        return () => {
            window.removeEventListener("focus", onFocus)
            window.removeEventListener("blur", onBlur)
        }
    }, [])
    return blurred
}
