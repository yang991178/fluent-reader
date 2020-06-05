import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import Page from "../components/page"

const getFeeds = (state: RootState) => state.page.feedId
const getSettings = (state: RootState) => state.app.settings.display

const mapStateToProps = createSelector(
    [getFeeds, getSettings],
    (feeds, settingsOn) => ({
        feeds: [feeds],
        settingsOn: settingsOn
    })
)

const PageContainer = connect(mapStateToProps)(Page)
export default PageContainer