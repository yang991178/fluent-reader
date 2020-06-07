import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import { RSSItem, markUnread, markRead } from "../scripts/models/item"
import { AppDispatch } from "../scripts/utils"
import { dismissItem } from "../scripts/models/page"
import Article from "../components/article"

type ArticleContainerProps = {
    itemId: number
}

const getItem = (state: RootState, props: ArticleContainerProps) => state.items[props.itemId]
const getSource = (state: RootState, props: ArticleContainerProps) => state.sources[state.items[props.itemId].source]

const makeMapStateToProps = () => {
    return createSelector(
        [getItem, getSource],
        (item, source) => ({
            item: item,
            source: source
        })
    )
}

const mapDispatchToProps = (dispatch: AppDispatch) => {
    return {
        dismiss: () => dispatch(dismissItem()),
        toggleHasRead: (item: RSSItem) => dispatch(item.hasRead ? markUnread(item) : markRead(item))
    }
}

const ArticleContainer = connect(makeMapStateToProps, mapDispatchToProps)(Article)
export default ArticleContainer