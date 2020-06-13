import fs = require("fs")
import { SourceActionTypes, ADD_SOURCE, DELETE_SOURCE, addSource } from "./source"

import { ActionStatus, AppThunk, domParser, AppDispatch } from "../utils"
import { saveSettings } from "./app"
import { store } from "../settings"

const GROUPS_STORE_KEY = "sourceGroups"

export class SourceGroup {
    isMultiple: boolean
    sids: number[]
    name?: string
    expanded?: boolean
    index?: number // available only from groups tab container

    constructor(sids: number[], name: string = null) {
        name = (name && name.trim()) || "订阅源组"
        if (sids.length == 1) {
            this.isMultiple = false
        } else {
            this.isMultiple = true
            this.name = name
        }
        this.sids = sids
    }

    static save(groups: SourceGroup[]) {
        store.set(GROUPS_STORE_KEY, groups)
    }

    static load(): SourceGroup[] {
        return store.get(GROUPS_STORE_KEY, [])
    }
}

export const CREATE_SOURCE_GROUP = "CREATE_SOURCE_GROUP"
export const ADD_SOURCE_TO_GROUP = "ADD_SOURCE_TO_GROUP"
export const REMOVE_SOURCE_FROM_GROUP = "REMOVE_SOURCE_FROM_GROUP"
export const UPDATE_SOURCE_GROUP = "UPDATE_SOURCE_GROUP"
export const REORDER_SOURCE_GROUPS = "REORDER_SOURCE_GROUPS"
export const DELETE_SOURCE_GROUP = "DELETE_SOURCE_GROUP"
export const TOGGLE_GROUP_EXPANSION = "TOGGLE_GROUP_EXPANSION"

interface CreateSourceGroupAction {
    type: typeof CREATE_SOURCE_GROUP,
    group: SourceGroup
}

interface AddSourceToGroupAction {
    type: typeof ADD_SOURCE_TO_GROUP,
    groupIndex: number,
    sid: number
}

interface RemoveSourceFromGroupAction {
    type: typeof REMOVE_SOURCE_FROM_GROUP,
    groupIndex: number,
    sids: number[]
}

interface UpdateSourceGroupAction {
    type: typeof UPDATE_SOURCE_GROUP,
    groupIndex: number,
    group: SourceGroup
}

interface ReorderSourceGroupsAction {
    type: typeof REORDER_SOURCE_GROUPS,
    groups: SourceGroup[]
}

interface DeleteSourceGroupAction {
    type: typeof DELETE_SOURCE_GROUP,
    groupIndex: number
}

interface ToggleGroupExpansionAction {
    type: typeof TOGGLE_GROUP_EXPANSION,
    groupIndex: number
}

export type SourceGroupActionTypes = CreateSourceGroupAction | AddSourceToGroupAction 
    | RemoveSourceFromGroupAction | UpdateSourceGroupAction | ReorderSourceGroupsAction 
    | DeleteSourceGroupAction | ToggleGroupExpansionAction

export function createSourceGroupDone(group: SourceGroup): SourceGroupActionTypes {
    return {
        type: CREATE_SOURCE_GROUP,
        group: group
    }
}

export function createSourceGroup(name: string): AppThunk<number> {
    return (dispatch, getState) => {
        let group = new SourceGroup([], name)
        dispatch(createSourceGroupDone(group))
        let groups = getState().groups
        SourceGroup.save(groups)
        return groups.length - 1
    }
}

function addSourceToGroupDone(groupIndex: number, sid: number): SourceGroupActionTypes {
    return {
        type: ADD_SOURCE_TO_GROUP,
        groupIndex: groupIndex,
        sid: sid
    }
}

export function addSourceToGroup(groupIndex: number, sid: number): AppThunk {
    return (dispatch, getState) => {
        dispatch(addSourceToGroupDone(groupIndex, sid))
        SourceGroup.save(getState().groups)
    }
}

function removeSourceFromGroupDone(groupIndex: number, sids: number[]): SourceGroupActionTypes {
    return {
        type: REMOVE_SOURCE_FROM_GROUP,
        groupIndex: groupIndex,
        sids: sids
    }
}

export function removeSourceFromGroup(groupIndex: number, sids: number[]): AppThunk {
    return (dispatch, getState) => {
        dispatch(removeSourceFromGroupDone(groupIndex, sids))
        SourceGroup.save(getState().groups)
    }
}

function deleteSourceGroupDone(groupIndex: number): SourceGroupActionTypes {
    return {
        type: DELETE_SOURCE_GROUP,
        groupIndex: groupIndex
    }
}

export function deleteSourceGroup(groupIndex: number): AppThunk {
    return (dispatch, getState) => {
        dispatch(deleteSourceGroupDone(groupIndex))
        SourceGroup.save(getState().groups)
    }
}

function updateSourceGroupDone(group: SourceGroup): SourceGroupActionTypes {
    return {
        type: UPDATE_SOURCE_GROUP,
        groupIndex: group.index,
        group: group
    }
}

export function updateSourceGroup(group: SourceGroup): AppThunk {
    return (dispatch, getState) => {
        dispatch(updateSourceGroupDone(group))
        SourceGroup.save(getState().groups)
    }
}

function reorderSourceGroupsDone(groups: SourceGroup[]): SourceGroupActionTypes {
    return {
        type: REORDER_SOURCE_GROUPS,
        groups: groups
    }
}

export function reorderSourceGroups(groups: SourceGroup[]): AppThunk {
    return (dispatch, getState) => {
        dispatch(reorderSourceGroupsDone(groups))
        SourceGroup.save(getState().groups)
    }
}

export function toggleGroupExpansion(groupIndex: number): AppThunk {
    return (dispatch, getState) => {
        dispatch({
            type: TOGGLE_GROUP_EXPANSION,
            groupIndex: groupIndex
        })
        SourceGroup.save(getState().groups)
    }
}

async function outlineToSource(dispatch: AppDispatch, outline: Element): Promise<number> {
    let url = outline.getAttribute("xmlUrl")
    let name = outline.getAttribute("text") || outline.getAttribute("name")
    if (url) {
        try {
            return await dispatch(addSource(url.trim(), name, true))
        } catch (e) {
            return null
        }
    } else {
        return null
    }
}

export function importOPML(path: string): AppThunk {
    return async (dispatch) => {
        fs.readFile(path, "utf-8", async (err, data) => {
            if (err) {
                console.log(err)
            } else {
                dispatch(saveSettings())
                let successes: number = 0, failures: number = 0
                let doc = domParser.parseFromString(data, "text/xml").getElementsByTagName("body")
                if (doc.length == 0) {
                    dispatch(saveSettings())
                    return
                }
                for (let el of doc[0].children) {
                    if (el.getAttribute("type") === "rss") {
                        let sid = await outlineToSource(dispatch, el)
                        if (sid === null) failures += 1
                        else successes += 1
                    } else if (el.hasAttribute("text") || el.hasAttribute("title")) {
                        let groupName = el.getAttribute("text") || el.getAttribute("title")
                        let gid = dispatch(createSourceGroup(groupName))
                        for (let child of el.children) {
                            let sid = await outlineToSource(dispatch, child)
                            if (sid === null) {
                                failures += 1
                            } else {
                                successes += 1
                                dispatch(addSourceToGroup(gid, sid))
                            }
                        }
                    }
                }
                console.log(failures, successes)
                dispatch(saveSettings())
            }
        })
    }
}

export type GroupState = SourceGroup[]

export function groupReducer(
    state = SourceGroup.load(),
    action: SourceActionTypes | SourceGroupActionTypes
): GroupState {
    switch(action.type) {
        case ADD_SOURCE:
            switch (action.status) {
                case ActionStatus.Success: return [
                    ...state,
                    new SourceGroup([action.source.sid])
                ]
                default: return state
            }
        case DELETE_SOURCE: return [
            ...state.map(group => ({
                ...group,
                sids: group.sids.filter(sid => sid != action.source.sid)
            })).filter(g => g.isMultiple || g.sids.length == 1)
        ]
        case CREATE_SOURCE_GROUP: return [ ...state, action.group ]
        case ADD_SOURCE_TO_GROUP: return state.map((g, i) => i == action.groupIndex ? ({
            ...g,
            sids: [ ...g.sids, action.sid ]
        }) : g).filter(g => g.isMultiple || !g.sids.includes(action.sid))
        case REMOVE_SOURCE_FROM_GROUP: return [
            ...state.slice(0, action.groupIndex),
            { 
                ...state[action.groupIndex],
                sids: state[action.groupIndex].sids.filter(sid => !action.sids.includes(sid))
            },
            ...action.sids.map(sid => new SourceGroup([sid])),
            ...state.slice(action.groupIndex + 1)
        ]
        case UPDATE_SOURCE_GROUP: return [ 
            ...state.slice(0, action.groupIndex),
            action.group,
            ...state.slice(action.groupIndex + 1)
        ]
        case REORDER_SOURCE_GROUPS: return action.groups
        case DELETE_SOURCE_GROUP: return [
            ...state.slice(0, action.groupIndex),
            ...state[action.groupIndex].sids.map(sid => new SourceGroup([sid])),
            ...state.slice(action.groupIndex + 1)
        ]
        case TOGGLE_GROUP_EXPANSION: return state.map((g, i) => i == action.groupIndex ? ({
            ...g,
            expanded: !g.expanded
        }) : g)
        default: return state
    }
}