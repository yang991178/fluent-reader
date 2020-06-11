import * as React from "react"
import * as ReactDOM from "react-dom"
import { Provider } from "react-redux"
import { createStore, applyMiddleware } from "redux"
import thunkMiddleware from "redux-thunk"
import { loadTheme } from '@fluentui/react'
import { initializeIcons } from "@fluentui/react/lib/Icons"
import { rootReducer, RootState } from "./scripts/reducer"
import { initSources } from "./scripts/models/source"
import { fetchItems } from "./scripts/models/item"
import Root from "./components/root"
import { initFeeds } from "./scripts/models/feed"
import { AppDispatch } from "./scripts/utils"
import { setProxy, applyThemeSettings } from "./scripts/settings"

setProxy()

applyThemeSettings()
initializeIcons("icons/")

const store = createStore(
    rootReducer,
    applyMiddleware<AppDispatch, RootState>(thunkMiddleware)
)

store.dispatch(initSources()).then(() => store.dispatch(initFeeds())).then(() => store.dispatch(fetchItems()))

ReactDOM.render(
    <Provider store={store}>
        <Root />
    </Provider>,
    document.getElementById("app")
)