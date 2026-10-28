import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import intl from "react-intl-universal"
import { Async } from "@fluentui/react"
import { SearchBox } from "@fluentui/react-components"
import { makeStyles, mergeClasses, shorthands } from "@griffel/react"
import { useAppDispatch, useAppSelector } from "../../scripts/reducer"
import { validateRegex } from "../../scripts/utils"
import { performSearch } from "../../scripts/models/page"

const useStyles = makeStyles({
    root: {
        "&.fui-SearchBox": shorthands.borderStyle("none"),
        "maxWidth": "none",
        "WebkitAppRegion": "no-drag",
        "boxShadow":
            "0 1.6px 3.6px 0 rgba(0, 0, 0, 0.132), 0 0.3px 0.9px 0 rgba(0, 0, 0, 0.108)",
    },
    inline: {
        minWidth: 0,
        flexShrink: 0,
        height: "32px",
        margin: "8px 12px",
    },
    floating: {
        // Input's runtime reset styles must not override the toolbar geometry.
        "&.fui-SearchBox": {
            position: "absolute",
            minHeight: 0,
        },
        "zIndex": 4,
        "top": 0,
        "left": "36px",
        "width": "100%",
        "maxWidth": "calc(100% - 484px)",
        "margin": "4px 16px",
        "height": "calc(var(--navHeight) - 4px)",
    },
    floatingDarwin: {
        "&:is(body.not-fullscreen *)": {
            left: "108px",
            maxWidth: "calc(100% - 384px)",
        },
    },
    floatingMenu: {
        "@media (min-width: 1440px)": {
            left: "280px",
            maxWidth: "calc(100% - 728px)",
        },
    },
    floatingDarwinMenu: {
        "@media (min-width: 1440px)": {
            "left": "280px",
            "maxWidth": "calc(100% - 556px)",
            "&:is(body.not-fullscreen *)": {
                left: "280px",
                maxWidth: "calc(100% - 556px)",
            },
        },
    },
})

export default function ArticleSearch({
    inline = false,
    styleClass,
}: {
    inline?: boolean
    styleClass?: string
}) {
    const classes = useStyles()
    const dispatch = useAppDispatch()
    const searchOn = useAppSelector(state => state.page.searchOn)
    const initQuery = useAppSelector(state => state.page.filter.search)
    const menuOn = useAppSelector(state => state.app.menu)
    const [query, setQuery] = useState(initQuery)
    const input = useRef<HTMLInputElement>(null)
    const isDarwin = window.utils.platform === "darwin"
    const search = useMemo(() => {
        const scheduler = new Async()
        return {
            run: scheduler.debounce((value: string) => {
                if (validateRegex(value) !== null)
                    dispatch(performSearch(value))
            }, 750),
            dispose: () => scheduler.dispose(),
        }
    }, [dispatch])

    useEffect(() => search.dispose, [search])
    useEffect(() => {
        if (searchOn) {
            setQuery(initQuery)
            input.current?.focus()
        }
    }, [searchOn])

    return searchOn ? (
        <SearchBox
            ref={input}
            className={mergeClasses(
                !inline && "article-search",
                classes.root,
                inline ? classes.inline : classes.floating,
                !inline && isDarwin && classes.floatingDarwin,
                !inline && menuOn && classes.floatingMenu,
                !inline && menuOn && isDarwin && classes.floatingDarwinMenu,
                styleClass
            )}
            placeholder={intl.get("search")}
            value={query}
            dismiss={
                query
                    ? {
                          "aria-label": "Clear text",
                          "tabIndex": 0,
                          "onKeyDown": event => {
                              if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault()
                                  event.currentTarget.click()
                              }
                          },
                      }
                    : null
            }
            onChange={(_, { value }) => {
                setQuery(value)
                search.run(value)
            }}
            onKeyDown={event => {
                if (event.key === "Escape" && query) {
                    event.preventDefault()
                    event.stopPropagation()
                    setQuery("")
                    search.run("")
                }
            }}
        />
    ) : null
}
