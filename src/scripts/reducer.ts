import { applyMiddleware, combineReducers, createStore } from "redux"
import thunkMiddleware from "redux-thunk"

import { sourceReducer } from "./models/source"
import { itemReducer } from "./models/item"
import { feedReducer } from "./models/feed"
import { appReducer } from "./models/app"
import { groupReducer } from "./models/group"
import { pageReducer } from "./models/page"
import { serviceReducer } from "./models/service"
import { AppDispatch } from "./utils"
import {
    TypedUseSelectorHook,
    useDispatch,
    useSelector,
    useStore,
} from "react-redux"

export const rootReducer = combineReducers({
    sources: sourceReducer,
    items: itemReducer,
    feeds: feedReducer,
    groups: groupReducer,
    page: pageReducer,
    service: serviceReducer,
    app: appReducer,
})

export const rootStore = createStore(
    rootReducer,
    applyMiddleware<AppDispatch, RootState>(thunkMiddleware)
)

export type AppStore = typeof rootStore
export type RootState = ReturnType<typeof rootReducer>

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
export const useAppStore: () => AppStore = useStore
