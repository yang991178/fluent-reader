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
        groups: groups,
        serviceOn: serviceOn,
        key: groups.length,
    })
)

const mapDispatchToProps = (dispatch: AppDispatch) => ({
    createGroup: (name: string) => dispatch(createSourceGroup(name)),
    updateGroup: (group: SourceGroup) => dispatch(updateSourceGroup(group)),
    addToGroup: (gid: number, sid: number) =>
        dispatch(addSourceToGroup(gid, sid)),
    deleteGroup: (gid: number) => dispatch(deleteSourceGroup(gid)),
    removeFromGroup: (gid: number, sids: number[]) =>
        dispatch(removeSourceFromGroup(gid, sids)),
    reorderGroups: (groups: SourceGroup[]) =>
        dispatch(reorderSourceGroups(groups)),
    importGroups: () => dispatch(importGroups()),
})

const GroupsTabContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(GroupsTab)
export default GroupsTabContainer
