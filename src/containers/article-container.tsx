import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import { RSSItem, markUnread, markRead, toggleStarred, toggleHidden } from "../scripts/models/item"
import { AppDispatch } from "../scripts/utils"
import { dismissItem } from "../scripts/models/page"
import Article from "../components/article"
import { openTextMenu } from "../scripts/models/app"

type ArticleContainerProps = {
    itemId: string
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
        toggleHasRead: (item: RSSItem) => dispatch(item.hasRead ? markUnread(item) : markRead(item)),
        toggleStarred: (item: RSSItem) => dispatch(toggleStarred(item)),
        toggleHidden: (item: RSSItem) => dispatch(toggleHidden(item)),
        textMenu: (text: string, position: [number, number]) => dispatch(openTextMenu(text, position))
    }
}

const ArticleContainer = connect(makeMapStateToProps, mapDispatchToProps)(Article)
export default ArticleContainer