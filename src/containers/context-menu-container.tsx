import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import { ContextMenuType, closeContextMenu } from "../scripts/models/app"
import { ContextMenu } from "../components/context-menu"
import { RSSItem, markRead, markUnread } from "../scripts/models/item"

const getContext = (state: RootState) => state.app.contextMenu

const mapStateToProps = createSelector(
    [getContext],
    (context) => {
        switch (context.type) {
            case ContextMenuType.Item: return {
                type: context.type,
                event: context.event,
                item: context.target as RSSItem
            }
            default: return { type: ContextMenuType.Hidden }
        }
    }
)

const mapDispatchToProps = dispatch => {
    return {
        markRead: item => dispatch(markRead(item)),
        markUnread: item => dispatch(markUnread(item)),
        close: () => dispatch(closeContextMenu())
    }
}

const connector = connect(mapStateToProps, mapDispatchToProps)
export type ContextReduxProps = typeof connector
export const ContextMenuContainer = connector(ContextMenu)