import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import { RSSItem, markUnread, markRead, toggleStarred, toggleHidden, itemShortcuts } from "../scripts/models/item"
import { AppDispatch } from "../scripts/utils"
import { dismissItem, showOffsetItem } from "../scripts/models/page"
import Article from "../components/article"
import { openTextMenu } from "../scripts/models/app"

type ArticleContainerProps = {
    itemId: string
}

const getItem = (state: RootState, props: ArticleContainerProps) => state.items[props.itemId]
const getSource = (state: RootState, props: ArticleContainerProps) => state.sources[state.items[props.itemId].source]
const getLocale = (state: RootState) => state.app.locale

const makeMapStateToProps = () => {
    return createSelector(
        [getItem, getSource, getLocale],
        (item, source, locale) => ({
            item: item,
            source: source,
            locale: locale
        })
    )
}

const mapDispatchToProps = (dispatch: AppDispatch) => {
    return {
        shortcuts: (item: RSSItem, key: string) => dispatch(itemShortcuts(item, key)),
        dismiss: () => dispatch(dismissItem()),
        offsetItem: (offset: number) => dispatch(showOffsetItem(offset)),
        toggleHasRead: (item: RSSItem) => dispatch(item.hasRead ? markUnread(item) : markRead(item)),
        toggleStarred: (item: RSSItem) => dispatch(toggleStarred(item)),
        toggleHidden: (item: RSSItem) => dispatch(toggleHidden(item)),
        textMenu: (text: string, position: [number, number]) => dispatch(openTextMenu(text, position))
    }
}

const ArticleContainer = connect(makeMapStateToProps, mapDispatchToProps)(Article)
export default ArticleContainer