import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import intl from "react-intl-universal"
import { useSelector, useDispatch } from "react-redux"
import { Icon } from "@fluentui/react/lib/Icon"
import { ProgressIndicator, IObjectWithKey } from "@fluentui/react"
import { RootState } from "../scripts/reducer"
import { fetchItems } from "../scripts/models/item"
import { makeStyles } from "@fluentui/react-components"
import {
    toggleMenu,
    toggleLogMenu,
    toggleSettings,
    openViewMenu,
    openMarkAllMenu,
} from "../scripts/models/app"
import { toggleSearch } from "../scripts/models/page"
import { ViewType, WindowStateListenerType } from "../schema-types"

const useClasses = makeStyles({
    progress: {
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 10,
        width: "100%",
        height: "2px",
        overflow: "hidden",
    },
})

const Nav: React.FC = () => {
    const classes = useClasses()
    const dispatch = useDispatch()
    const state = useSelector((state: RootState) => state.app)
    const itemShown = useSelector(
        (state: RootState) =>
            state.page.itemId && state.page.viewType !== ViewType.List
    )
    const [maximized, setMaximized] = useState(globalThis.utils.isMaximized())

    const setBodyFocusState = useCallback((focused: boolean) => {
        if (focused) document.body.classList.remove("blur")
        else document.body.classList.add("blur")
    }, [])

    const setBodyFullscreenState = useCallback((fullscreen: boolean) => {
        if (fullscreen) document.body.classList.remove("not-fullscreen")
        else document.body.classList.add("not-fullscreen")
    }, [])

    const windowStateListener = useCallback(
        (type: WindowStateListenerType, windowState: boolean) => {
            switch (type) {
                case WindowStateListenerType.Maximized:
                    setMaximized(windowState)
                    break
                case WindowStateListenerType.Fullscreen:
                    setBodyFullscreenState(windowState)
                    break
                case WindowStateListenerType.Focused:
                    setBodyFocusState(windowState)
                    break
            }
        },
        [setBodyFocusState, setBodyFullscreenState]
    )

    const canFetch = useCallback(
        () =>
            state.sourceInit &&
            state.feedInit &&
            !state.syncing &&
            !state.fetchingItems,
        [state.sourceInit, state.feedInit, state.syncing, state.fetchingItems]
    )

    const fetch = useCallback(() => {
        if (canFetch()) dispatch(fetchItems())
    }, [canFetch, dispatch])

    const menu = useCallback(() => dispatch(toggleMenu()), [dispatch])
    const logs = useCallback(() => dispatch(toggleLogMenu()), [dispatch])
    const search = useCallback(() => dispatch(toggleSearch()), [dispatch])
    const settings = useCallback(() => dispatch(toggleSettings()), [dispatch])
    const markAll = useCallback(() => dispatch(openMarkAllMenu()), [dispatch])
    const views = useCallback(() => {
        if (state.contextMenu.event !== "#view-toggle") {
            dispatch(openViewMenu())
        }
    }, [state.contextMenu.event, dispatch])

    const navShortcutsHandler = useCallback(
        (e: KeyboardEvent | IObjectWithKey) => {
            if (!state.settings.display) {
                switch (e.key) {
                    case "F1":
                        menu()
                        break
                    case "F2":
                        search()
                        break
                    case "F5":
                        fetch()
                        break
                    case "F6":
                        markAll()
                        break
                    case "F7":
                        if (!itemShown) logs()
                        break
                    case "F8":
                        if (!itemShown) views()
                        break
                    case "F9":
                        if (!itemShown) settings()
                        break
                }
            }
        },
        [
            state.settings.display,
            itemShown,
            menu,
            search,
            fetch,
            markAll,
            logs,
            views,
            settings,
        ]
    )

    useEffect(() => {
        setBodyFocusState(globalThis.utils.isFocused())
        setBodyFullscreenState(globalThis.utils.isFullscreen())
        globalThis.utils.addWindowStateListener(windowStateListener)

        return () => {
            // Cleanup will be handled by the event listener removal effect
        }
    }, [setBodyFocusState, setBodyFullscreenState, windowStateListener])

    useEffect(() => {
        document.addEventListener("keydown", navShortcutsHandler)
        if (globalThis.utils.platform === "darwin")
            globalThis.utils.addTouchBarEventsListener(navShortcutsHandler)

        return () => {
            document.removeEventListener("keydown", navShortcutsHandler)
        }
    }, [navShortcutsHandler])

    const minimize = () => {
        globalThis.utils.minimizeWindow()
    }

    const maximize = () => {
        globalThis.utils.maximizeWindow()
        setMaximized(!maximized)
    }

    const close = () => {
        globalThis.utils.closeWindow()
    }

    const fetching = () => (canFetch() ? "" : " fetching")

    const getClassNames = () => {
        const classNames = new Array<string>()
        if (state.settings.display) classNames.push("hide-btns")
        if (state.menu) classNames.push("menu-on")
        if (itemShown) classNames.push("item-on")
        return classNames.join(" ")
    }

    const getProgress = () => {
        return state.fetchingTotal > 0
            ? state.fetchingProgress / state.fetchingTotal
            : null
    }

    return (
        <nav className={getClassNames()}>
            <div className="btn-group">
                <button
                    className="btn hide-wide"
                    title={intl.get("nav.menu")}
                    onClick={menu}>
                    <Icon
                        iconName={
                            globalThis.utils.platform === "darwin"
                                ? "SidePanel"
                                : "GlobalNavButton"
                        }
                    />
                </button>
            </div>
            <span className="title">{state.title}</span>
            <div className="btn-group" style={{ float: "right" }}>
                <button
                    className={"btn" + fetching()}
                    onClick={fetch}
                    title={intl.get("nav.refresh")}>
                    <Icon iconName="Refresh" />
                </button>
                <button
                    className="btn"
                    id="mark-all-toggle"
                    onClick={markAll}
                    title={intl.get("nav.markAllRead")}
                    onMouseDown={e => {
                        if (state.contextMenu.event === "#mark-all-toggle")
                            e.stopPropagation()
                    }}>
                    <Icon iconName="InboxCheck" />
                </button>
                <button
                    className="btn"
                    id="log-toggle"
                    title={intl.get("nav.notifications")}
                    onClick={logs}>
                    {state.logMenu.notify ? (
                        <Icon iconName="RingerSolid" />
                    ) : (
                        <Icon iconName="Ringer" />
                    )}
                </button>
                <button
                    className="btn"
                    id="view-toggle"
                    title={intl.get("nav.view")}
                    onClick={views}
                    onMouseDown={e => {
                        if (state.contextMenu.event === "#view-toggle")
                            e.stopPropagation()
                    }}>
                    <Icon iconName="View" />
                </button>
                <button
                    className="btn"
                    title={intl.get("nav.settings")}
                    onClick={settings}>
                    <Icon iconName="Settings" />
                </button>
                <span className="seperator"></span>
                <button
                    className="btn system"
                    title={intl.get("nav.minimize")}
                    onClick={minimize}
                    style={{ fontSize: 12 }}>
                    <Icon iconName="Remove" />
                </button>
                <button
                    className="btn system"
                    title={intl.get("nav.maximize")}
                    onClick={maximize}>
                    {maximized ? (
                        <Icon
                            iconName="ChromeRestore"
                            style={{ fontSize: 11 }}
                        />
                    ) : (
                        <Icon iconName="Checkbox" style={{ fontSize: 10 }} />
                    )}
                </button>
                <button
                    className="btn system close"
                    title={intl.get("close")}
                    onClick={close}>
                    <Icon iconName="Cancel" />
                </button>
            </div>
            {!canFetch() && (
                <ProgressIndicator
                    className={classes.progress}
                    percentComplete={getProgress()}
                />
            )}
        </nav>
    )
}

export default Nav
