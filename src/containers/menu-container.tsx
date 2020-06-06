import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import { Menu } from "../components/menu"
import { toggleMenu } from "../scripts/models/app"
import { SourceGroup } from "../scripts/models/group"
import { selectAllArticles, selectSources } from "../scripts/models/page"
import { initFeeds } from "../scripts/models/feed"
import { RSSSource } from "../scripts/models/source"

const getStatus = (state: RootState) => state.app.menu && state.app.sourceInit
const getKey = (state: RootState) => state.app.menuKey
const getSources = (state: RootState) => state.sources
const getGroups = (state: RootState) => state.groups

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
    }
})

const MenuContainer = connect(mapStateToProps, mapDispatchToProps)(Menu)
export default MenuContainer