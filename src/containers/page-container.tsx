import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import Page from "../components/page"
import { AppDispatch } from "../scripts/utils"
import { dismissItem } from "../scripts/models/page"

const getPage = (state: RootState) => state.page
const getSettings = (state: RootState) => state.app.settings.display
const getMenu = (state: RootState) => state.app.menu
const getItems = (state: RootState) => state.items
const getFeeds = (state: RootState) => state.feeds

const mapStateToProps = createSelector(
    [getPage, getSettings, getMenu, getItems, getFeeds],
    (page, settingsOn, menuOn, items, feeds) => ({
        feeds: [page.feedId],
        settingsOn: settingsOn,
        menuOn: menuOn,
        item: page.itemIndex >= 0 // && page.itemIndex < feeds[page.feedId].iids.length 
            ? items[feeds[page.feedId].iids[page.itemIndex]]
            : null
    })
)

const mapDispatchToProps = (dispatch: AppDispatch) => ({
    dismissItem: () => dispatch(dismissItem())
})

const PageContainer = connect(mapStateToProps, mapDispatchToProps)(Page)
export default PageContainer