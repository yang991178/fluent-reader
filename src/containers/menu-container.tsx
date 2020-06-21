import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import { Menu } from "../components/menu"
import { toggleMenu, openGroupMenu } from "../scripts/models/app"
import { SourceGroup, toggleGroupExpansion } from "../scripts/models/group"
import { selectAllArticles, selectSources, toggleSearch, ViewType } from "../scripts/models/page"
import { initFeeds } from "../scripts/models/feed"
import { RSSSource } from "../scripts/models/source"

const getApp = (state: RootState) => state.app
const getSources = (state: RootState) => state.sources
const getGroups = (state: RootState) => state.groups
const getSearchOn = (state: RootState) => state.page.searchOn
const getItemOn = (state: RootState) => state.page.itemId !== null && state.page.viewType !== ViewType.List

const mapStateToProps = createSelector(
    [getApp, getSources, getGroups, getSearchOn, getItemOn],
    (app, sources, groups, searchOn, itemOn) => ({
        status: app.sourceInit,
        display: app.menu,
        selected: app.menuKey,
        sources: sources,
        groups: groups,
        searchOn: searchOn,
        itemOn: itemOn,
    })
)

const mapDispatchToProps = dispatch => ({
    toggleMenu: () => dispatch(toggleMenu()),
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
    },
    groupContextMenu: (sids: number[], event: React.MouseEvent) => {
        dispatch(openGroupMenu(sids, event))
    },
    updateGroupExpansion: (event: React.MouseEvent<HTMLElement>, key: string, selected: string) => {
        if ((event.target as HTMLElement).tagName !== "DIV" || key === selected) {
            let [type, index] = key.split("-")
            if (type === "g") dispatch(toggleGroupExpansion(parseInt(index)))
        }
    },
    toggleSearch: () => dispatch(toggleSearch()),
})

const MenuContainer = connect(mapStateToProps, mapDispatchToProps)(Menu)
export default MenuContainer