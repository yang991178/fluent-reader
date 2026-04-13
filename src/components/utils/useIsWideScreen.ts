import { useState, useEffect } from "react"
import { getWindowBreakpoint } from "../../scripts/utils"

export const useIsWideScreen = () => {
    const [isWide, setIsWide] = useState(getWindowBreakpoint)

    useEffect(() => {
        const handler = () => setIsWide(getWindowBreakpoint())
        window.addEventListener("resize", handler)
        return () => window.removeEventListener("resize", handler)
    }, [])

    return isWide
}
