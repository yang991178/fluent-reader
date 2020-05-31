import * as React from "react"
import * as ReactDOM from "react-dom"
import { Provider } from "react-redux"
import { createStore, applyMiddleware, AnyAction } from "redux"
import thunkMiddleware, { ThunkDispatch } from "redux-thunk"
import { loadTheme } from '@fluentui/react'
import { initializeIcons } from "@fluentui/react/lib/Icons"
import { rootReducer, RootState } from "./scripts/reducer"
import { initSources, addSource } from "./scripts/models/source"
import { fetchItems } from "./scripts/models/item"
import Root from "./components/root"
import { initFeeds } from "./scripts/models/feed"

loadTheme({ defaultFontStyle: { fontFamily: '"Source Han Sans", sans-serif' } })
initializeIcons("icons/")

const store = createStore(
    rootReducer,
    applyMiddleware<ThunkDispatch<RootState, undefined, AnyAction>, RootState>(thunkMiddleware)
)

store.dispatch(initSources()).then(() => store.dispatch(initFeeds())).then(() => store.dispatch(fetchItems()))
/* store.dispatch(addSource("https://www.gcores.com/rss"))
.then(() => store.dispatch(addSource("https://www.ifanr.com/feed")))
.then(() => store.dispatch(addSource("https://www.vgtime.com/rss.jhtml")))
.then(() => store.dispatch(fetchItems())) */

ReactDOM.render(
    <Provider store={store}>
        <Root />
    </Provider>,
    document.getElementById("app")
)