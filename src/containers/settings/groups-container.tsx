import { remote } from "electron"
import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../../scripts/reducer"
import GroupsTab from "../../components/settings/groups"
import { createSourceGroup, SourceGroup, updateSourceGroup, addSourceToGroup, deleteSourceGroup, removeSourceFromGroup } from "../../scripts/models/page"

const getSources = (state: RootState) => state.sources
const getGroups = (state: RootState) => state.page.sourceGroups

const mapStateToProps = createSelector(
    [getSources, getGroups],
    (sources, groups) => ({
        sources: sources,
        groups: groups.map((g, i) => ({ ...g, index: i })),
        key: groups.length
    })
)

const mapDispatchToProps = dispatch => ({
    createGroup: (name: string) => dispatch(createSourceGroup(name)),
    updateGroup: (group: SourceGroup) => dispatch(updateSourceGroup(group)),
    addToGroup: (groupIndex: number, sid: number) => dispatch(addSourceToGroup(groupIndex, sid)),
    deleteGroup: (groupIndex: number) => dispatch(deleteSourceGroup(groupIndex)),
    removeFromGroup: (groupIndex: number, sids: number[]) => dispatch(removeSourceFromGroup(groupIndex, sids))
})

const GroupsTabContainer = connect(mapStateToProps, mapDispatchToProps)(GroupsTab)
export default GroupsTabContainer