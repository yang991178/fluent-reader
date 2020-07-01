import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import { ContextMenuType, closeContextMenu, toggleSettings } from "../scripts/models/app"
import { ContextMenu } from "../components/context-menu"
import { RSSItem, markRead, markUnread, toggleStarred, toggleHidden, markAllRead } from "../scripts/models/item"
import { showItem, switchView, switchFilter, toggleFilter } from "../scripts/models/page"
import { ViewType } from "../schema-types"
import { FilterType } from "../scripts/models/feed"

const getContext = (state: RootState) => state.app.contextMenu
const getViewType = (state: RootState) => state.page.viewType
const getFilter = (state: RootState) => state.page.filter

const mapStateToProps = createSelector(
    [getContext, getViewType, getFilter],
    (context, viewType, filter) => {
        switch (context.type) {
            case ContextMenuType.Item: return {
                type: context.type,
                event: context.event,
                item: context.target[0],
                feedId: context.target[1]
            }
            case ContextMenuType.Text: return {
                type: context.type,
                position: context.position,
                text: context.target as string
            }
            case ContextMenuType.View: return {
                type: context.type,
                event: context.event,
                viewType: viewType,
                filter: filter.type
            }
            case ContextMenuType.Group: return {
                type: context.type,
                event: context.event,
                sids: context.target
            }
            default: return { type: ContextMenuType.Hidden }
        }
    }
)

const mapDispatchToProps = dispatch => {
    return {
        showItem: (feedId: string, item: RSSItem) => dispatch(showItem(feedId, item)),
        markRead: (item: RSSItem) => dispatch(markRead(item)),
        markUnread: (item: RSSItem) => dispatch(markUnread(item)),
        toggleStarred: (item: RSSItem) => dispatch(toggleStarred(item)),
        toggleHidden: (item: RSSItem) => {
            if(!item.hasRead) {
                dispatch(markRead(item))
                item.hasRead = true // get around chaining error
            }
            dispatch(toggleHidden(item))
        },
        switchView: (viewType: ViewType) => {
            window.settings.setDefaultView(viewType)
            dispatch(switchView(viewType))
        },
        switchFilter: (filter: FilterType) => dispatch(switchFilter(filter)),
        toggleFilter: (filter: FilterType) => dispatch(toggleFilter(filter)),
        markAllRead: (sids: number[]) => dispatch(markAllRead(sids)),
        settings: () => dispatch(toggleSettings()),
        close: () => dispatch(closeContextMenu())
    }
}

const connector = connect(mapStateToProps, mapDispatchToProps)
export type ContextReduxProps = typeof connector
export const ContextMenuContainer = connector(ContextMenu)