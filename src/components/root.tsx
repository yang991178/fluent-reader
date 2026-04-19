import * as React from "react"
import { closeContextMenu } from "../scripts/models/app"
import Page from "./page"
import { Menu } from "./menu"
import Nav from "./nav"
import Settings from "./settings"
import { useAppDispatch, useAppSelector } from "../scripts/reducer"
import { ContextMenu } from "./context-menu"
import LogMenu from "./log-menu"
import { FluentProvider, makeStyles, Theme } from "@fluentui/react-components"
import { useEffect, useMemo, useState } from "react"
import {
    CUSTOM_STYLE_HOOKS,
    customDarkTheme,
    customLightTheme,
} from "./utils/theme"
import { CustomStyleHooksProvider_unstable as CustomStyleHooksProvider } from "@fluentui/react-shared-contexts"
import { getFontFamilyForLocale } from "../scripts/settings"

const useClasses = makeStyles({
    root: {
        background: "none",
        height: "100%",
    },
})

const Root: React.FC = () => {
    const dispatch = useAppDispatch()
    const locale = useAppSelector(s => s.app.locale)

    const classes = useClasses()
    const [isDarkMode, setIsDarkMode] = useState(() =>
        globalThis.settings.shouldUseDarkColors()
    )
    useEffect(() => {
        globalThis.settings.addThemeUpdateListener(shouldDark => {
            setIsDarkMode(shouldDark)
        })
    }, [])
    const fluentTheme: Theme = useMemo(() => {
        const baseTheme = isDarkMode ? customDarkTheme : customLightTheme
        return {
            ...baseTheme,
            fontFamilyBase: getFontFamilyForLocale(locale),
        }
    }, [isDarkMode, locale])
    return (
        locale && (
            <FluentProvider theme={fluentTheme} className={classes.root}>
                <CustomStyleHooksProvider value={CUSTOM_STYLE_HOOKS}>
                    <div
                        id="root"
                        key={locale}
                        onMouseDown={() => dispatch(closeContextMenu())}>
                        <Nav />
                        <Page />
                        <LogMenu />
                        <Menu />
                        <Settings />
                        <ContextMenu />
                    </div>
                </CustomStyleHooksProvider>
            </FluentProvider>
        )
    )
}

export default Root
