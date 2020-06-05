import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import Page from "../components/page"

const getFeeds = (state: RootState) => state.page.feedId
const getSettings = (state: RootState) => state.app.settings.display
const getMenu = (state: RootState) => state.app.menu

const mapStateToProps = createSelector(
    [getFeeds, getSettings, getMenu],
    (feeds, settingsOn, menuOn) => ({
        feeds: [feeds],
        settingsOn: settingsOn,
        menuOn: menuOn
    })
)

const PageContainer = connect(mapStateToProps)(Page)
export default PageContainer