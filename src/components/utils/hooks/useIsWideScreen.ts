import { useState, useEffect } from "react"
import { getWindowBreakpoint } from "../../../scripts/utils"

export const useIsWideScreen = () => {
    const [isWide, setIsWide] = useState(getWindowBreakpoint)

    useEffect(() => {
        let timer: NodeJS.Timeout
        const handler = () => {
            clearTimeout(timer)
            timer = setTimeout(() => {
                setIsWide(getWindowBreakpoint())
            }, 100)
        }
        window.addEventListener("resize", handler)
        return () => window.removeEventListener("resize", handler)
    }, [])

    return isWide
}
