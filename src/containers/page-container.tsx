import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import Page from "../components/page"
import { AppDispatch } from "../scripts/utils"
import { dismissItem, showOffsetItem } from "../scripts/models/page"
import { ContextMenuType, setListPanelWidth } from "../scripts/models/app"

const getPage = (state: RootState) => state.page
const getSettings = (state: RootState) => state.app.settings.display
const getMenu = (state: RootState) => state.app.menu
const getContext = (state: RootState) =>
    state.app.contextMenu.type != ContextMenuType.Hidden
const getListPanelWidth = (state: RootState) => state.app.listPanelWidth

const mapStateToProps = createSelector(
    [getPage, getSettings, getMenu, getContext, getListPanelWidth],
    (page, settingsOn, menuOn, contextOn, listPanelWidth) => ({
        feeds: [page.feedId],
        settingsOn: settingsOn,
        menuOn: menuOn,
        contextOn: contextOn,
        itemId: page.itemId,
        itemFromFeed: page.itemFromFeed,
        viewType: page.viewType,
        listPanelWidth: listPanelWidth,
    })
)

const mapDispatchToProps = (dispatch: AppDispatch) => ({
    dismissItem: () => dispatch(dismissItem()),
    offsetItem: (offset: number) => dispatch(showOffsetItem(offset)),
    setListPanelWidth: (width: number) => dispatch(setListPanelWidth(width)),
})

const PageContainer = connect(mapStateToProps, mapDispatchToProps)(Page)
export default PageContainer
