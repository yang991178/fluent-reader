import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import { ContextMenuType, closeContextMenu } from "../scripts/models/app"
import { ContextMenu } from "../components/context-menu"
import { RSSItem, markRead, markUnread } from "../scripts/models/item"
import { showItem } from "../scripts/models/page"
import { FeedIdType } from "../scripts/models/feed"

const getContext = (state: RootState) => state.app.contextMenu

const mapStateToProps = createSelector(
    [getContext],
    (context) => {
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
            default: return { type: ContextMenuType.Hidden }
        }
    }
)

const mapDispatchToProps = dispatch => {
    return {
        showItem: (feedId: FeedIdType, item: RSSItem) => dispatch(showItem(feedId, item)),
        markRead: (item: RSSItem) => dispatch(markRead(item)),
        markUnread: (item: RSSItem) => dispatch(markUnread(item)),
        close: () => dispatch(closeContextMenu())
    }
}

const connector = connect(mapStateToProps, mapDispatchToProps)
export type ContextReduxProps = typeof connector
export const ContextMenuContainer = connector(ContextMenu)