import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import Page from "../components/page"
import { AppDispatch } from "../scripts/utils"
import { dismissItem, showOffsetItem } from "../scripts/models/page"

const getPage = (state: RootState) => state.page
const getSettings = (state: RootState) => state.app.settings.display
const getMenu = (state: RootState) => state.app.menu

const mapStateToProps = createSelector(
    [getPage, getSettings, getMenu],
    (page, settingsOn, menuOn) => ({
        feeds: [page.feedId],
        settingsOn: settingsOn,
        menuOn: menuOn,
        itemId: page.itemId
    })
)

const mapDispatchToProps = (dispatch: AppDispatch) => ({
    dismissItem: () => dispatch(dismissItem()),
    offsetItem: (offset: number) => dispatch(showOffsetItem(offset))
})

const PageContainer = connect(mapStateToProps, mapDispatchToProps)(Page)
export default PageContainer