import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import { Menu } from "../components/menu"
import { closeMenu } from "../scripts/models/app"
import { selectAllArticles, selectSources, SourceGroup } from "../scripts/models/page"
import { initFeeds } from "../scripts/models/feed"
import { RSSSource } from "../scripts/models/source"

const getStatus = (state: RootState) => state.app.menu
const getKey = (state: RootState) => state.app.menuKey
const getSources = (state: RootState) => state.sources
const getGroups = (state: RootState) => state.page.sourceGroups

const mapStateToProps = createSelector(
    [getStatus, getKey, getSources, getGroups],
    (status, key, sources, groups) => ({
        status: status,
        selected: key,
        sources: sources,
        groups: groups
    })
)

const mapDispatchToProps = dispatch => ({
    closeMenu: () => dispatch(closeMenu()),
    allArticles: () => {
        dispatch(selectAllArticles()),
        dispatch(initFeeds())
    },
    selectSourceGroup: (group: SourceGroup, menuKey: string) => {
        dispatch(selectSources(group.sids, menuKey, group.name))
        dispatch(initFeeds())
    },
    selectSource: (source: RSSSource) => {
        dispatch(selectSources([source.sid], "s-"+source.sid, source.name))
        dispatch(initFeeds())
    }
})

const connector = connect(mapStateToProps, mapDispatchToProps)
export type MenuReduxProps = typeof connector
export const MenuContainer = connector(Menu)