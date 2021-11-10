import { combineReducers } from "redux"

import { sourceReducer } from "./models/source"
import { itemReducer } from "./models/item"
import { feedReducer } from "./models/feed"
import { appReducer } from "./models/app"
import { groupReducer } from "./models/group"
import { pageReducer } from "./models/page"
import { serviceReducer } from "./models/service"

export const rootReducer = combineReducers({
    sources: sourceReducer,
    items: itemReducer,
    feeds: feedReducer,
    groups: groupReducer,
    page: pageReducer,
    service: serviceReducer,
    app: appReducer,
})

export type RootState = ReturnType<typeof rootReducer>
