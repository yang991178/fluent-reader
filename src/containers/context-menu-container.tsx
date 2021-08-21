import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import {
    ContextMenuType,
    closeContextMenu,
    toggleSettings,
} from "../scripts/models/app"
import { ContextMenu } from "../components/context-menu"
import {
    RSSItem,
    markRead,
    markUnread,
    toggleStarred,
    toggleHidden,
    markAllRead,
    fetchItems,
} from "../scripts/models/item"
import {
    showItem,
    switchView,
    switchFilter,
    toggleFilter,
    setViewConfigs,
} from "../scripts/models/page"
import { ViewType, ViewConfigs } from "../schema-types"
import { FilterType } from "../scripts/models/feed"

const getContext = (state: RootState) => state.app.contextMenu
const getViewType = (state: RootState) => state.page.viewType
const getFilter = (state: RootState) => state.page.filter
const getViewConfigs = (state: RootState) => state.page.viewConfigs

const mapStateToProps = createSelector(
    [getContext, getViewType, getFilter, getViewConfigs],
    (context, viewType, filter, viewConfigs) => {
        switch (context.type) {
            case ContextMenuType.Item:
                return {
                    type: context.type,
                    event: context.event,
                    viewConfigs: viewConfigs,
                    item: context.target[0],
                    feedId: context.target[1],
                }
            case ContextMenuType.Text:
                return {
                    type: context.type,
                    position: context.position,
                    text: context.target[0],
                    url: context.target[1],
                }
            case ContextMenuType.View:
                return {
                    type: context.type,
                    event: context.event,
                    viewType: viewType,
                    filter: filter.type,
                }
            case ContextMenuType.Group:
                return {
                    type: context.type,
                    event: context.event,
                    sids: context.target,
                }
            case ContextMenuType.Image:
                return {
                    type: context.type,
                    position: context.position,
                }
            case ContextMenuType.MarkRead:
                return {
                    type: context.type,
                    event: context.event,
                }
            default:
                return { type: ContextMenuType.Hidden }
        }
    }
)

const mapDispatchToProps = dispatch => {
    return {
        showItem: (feedId: string, item: RSSItem) =>
            dispatch(showItem(feedId, item)),
        markRead: (item: RSSItem) => dispatch(markRead(item)),
        markUnread: (item: RSSItem) => dispatch(markUnread(item)),
        toggleStarred: (item: RSSItem) => dispatch(toggleStarred(item)),
        toggleHidden: (item: RSSItem) => {
            if (!item.hasRead) {
                dispatch(markRead(item))
                item.hasRead = true // get around chaining error
            }
            dispatch(toggleHidden(item))
        },
        switchView: (viewType: ViewType) => {
            window.settings.setDefaultView(viewType)
            dispatch(switchView(viewType))
        },
        setViewConfigs: (configs: ViewConfigs) =>
            dispatch(setViewConfigs(configs)),
        switchFilter: (filter: FilterType) => dispatch(switchFilter(filter)),
        toggleFilter: (filter: FilterType) => dispatch(toggleFilter(filter)),
        markAllRead: (sids?: number[], date?: Date, before?: boolean) => {
            dispatch(markAllRead(sids, date, before))
        },
        fetchItems: (sids: number[]) => dispatch(fetchItems(false, sids)),
        settings: (sids: number[]) => dispatch(toggleSettings(true, sids)),
        close: () => dispatch(closeContextMenu()),
    }
}

const connector = connect(mapStateToProps, mapDispatchToProps)
export type ContextReduxProps = typeof connector
export const ContextMenuContainer = connector(ContextMenu)
