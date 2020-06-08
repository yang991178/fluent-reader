import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import { ContextMenuType, closeContextMenu } from "../scripts/models/app"
import { ContextMenu } from "../components/context-menu"
import { RSSItem, markRead, markUnread } from "../scripts/models/item"
import { showItem, switchView, ViewType } from "../scripts/models/page"
import { FeedIdType } from "../scripts/models/feed"
import { setDefaultView } from "../scripts/utils"

const getContext = (state: RootState) => state.app.contextMenu
const getViewType = (state: RootState) => state.page.viewType

const mapStateToProps = createSelector(
    [getContext, getViewType],
    (context, viewType) => {
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
                viewType: viewType
            }
            default: return { type: ContextMenuType.Hidden }
        }
    }
)

const mapDispatchToProps = dispatch => {
    return {
        showItem: (feedId: FeedIdType, item: RSSItem) => dispatch(showItem(feedId, item)),
        markRead: (item: RSSItem) => dispatch(markRead(item)),
        markUnread: (item: RSSItem) => dispatch(markUnread(item)),
        switchView: (viewType: ViewType) => {
            setDefaultView(viewType)
            dispatch(switchView(viewType))
        },
        close: () => dispatch(closeContextMenu())
    }
}

const connector = connect(mapStateToProps, mapDispatchToProps)
export type ContextReduxProps = typeof connector
export const ContextMenuContainer = connector(ContextMenu)