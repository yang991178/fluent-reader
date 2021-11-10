import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../../scripts/reducer"
import GroupsTab from "../../components/settings/groups"
import {
    createSourceGroup,
    updateSourceGroup,
    addSourceToGroup,
    deleteSourceGroup,
    removeSourceFromGroup,
    reorderSourceGroups,
} from "../../scripts/models/group"
import { SourceGroup, SyncService } from "../../schema-types"
import { importGroups } from "../../scripts/models/service"
import { AppDispatch } from "../../scripts/utils"

const getSources = (state: RootState) => state.sources
const getGroups = (state: RootState) => state.groups
const getServiceOn = (state: RootState) =>
    state.service.type !== SyncService.None

const mapStateToProps = createSelector(
    [getSources, getGroups, getServiceOn],
    (sources, groups, serviceOn) => ({
        sources: sources,
        groups: groups.map((g, i) => ({ ...g, index: i })),
        serviceOn: serviceOn,
        key: groups.length,
    })
)

const mapDispatchToProps = (dispatch: AppDispatch) => ({
    createGroup: (name: string) => dispatch(createSourceGroup(name)),
    updateGroup: (group: SourceGroup) => dispatch(updateSourceGroup(group)),
    addToGroup: (groupIndex: number, sid: number) =>
        dispatch(addSourceToGroup(groupIndex, sid)),
    deleteGroup: (groupIndex: number) =>
        dispatch(deleteSourceGroup(groupIndex)),
    removeFromGroup: (groupIndex: number, sids: number[]) =>
        dispatch(removeSourceFromGroup(groupIndex, sids)),
    reorderGroups: (groups: SourceGroup[]) =>
        dispatch(reorderSourceGroups(groups)),
    importGroups: () => dispatch(importGroups()),
})

const GroupsTabContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(GroupsTab)
export default GroupsTabContainer
