import fs = require("fs")
import { SourceActionTypes, ADD_SOURCE, DELETE_SOURCE, addSource } from "./source"
import { ALL, SOURCE } from "./feed"
import { ActionStatus, AppThunk, domParser, AppDispatch } from "../utils"
import { saveSettings } from "./app"

const GROUPS_STORE_KEY = "sourceGroups"

export class SourceGroup {
    isMultiple: boolean
    sids: number[]
    name?: string
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
        localStorage.setItem(GROUPS_STORE_KEY, JSON.stringify(groups))
    }

    static load(): SourceGroup[] {
        let stored = localStorage.getItem(GROUPS_STORE_KEY)
        return stored ? <SourceGroup[]>JSON.parse(stored) : []
    }
}

export const SELECT_PAGE = "SELECT_PAGE"

export enum PageType {
    AllArticles, Sources, Page
}

interface SelectPageAction {
    type: typeof SELECT_PAGE
    pageType: PageType
    init: boolean
    sids?: number[]
    menuKey?: string
    title?: string
}

export type PageActionTypes = SelectPageAction

export function selectAllArticles(init = false): SelectPageAction {
    return {
        type: SELECT_PAGE,
        pageType: PageType.AllArticles,
        init: init
    }
}

export function selectSources(sids: number[], menuKey: string, title: string) {
    return {
        type: SELECT_PAGE,
        pageType: PageType.Sources,
        sids: sids,
        menuKey: menuKey,
        title: title,
        init: true
    }
}

export const CREATE_SOURCE_GROUP = "CREATE_SOURCE_GROUP"
export const ADD_SOURCE_TO_GROUP = "ADD_SOURCE_TO_GROUP"
export const REMOVE_SOURCE_FROM_GROUP = "REMOVE_SOURCE_FROM_GROUP"
export const UPDATE_SOURCE_GROUP = "UPDATE_SOURCE_GROUP"
export const REORDER_SOURCE_GROUPS = "REORDER_SOURCE_GROUPS"
export const DELETE_SOURCE_GROUP = "DELETE_SOURCE_GROUP"

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

export type SourceGroupActionTypes = CreateSourceGroupAction | AddSourceToGroupAction 
    | RemoveSourceFromGroupAction | UpdateSourceGroupAction | ReorderSourceGroupsAction 
    | DeleteSourceGroupAction

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
        let groups = getState().page.sourceGroups
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
        SourceGroup.save(getState().page.sourceGroups)
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
        SourceGroup.save(getState().page.sourceGroups)
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
        SourceGroup.save(getState().page.sourceGroups)
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
        SourceGroup.save(getState().page.sourceGroups)
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
        SourceGroup.save(getState().page.sourceGroups)
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

export class PageState {
    feedId = ALL
    sourceGroups = SourceGroup.load()
}

export function pageReducer(
    state = new PageState(),
    action: PageActionTypes | SourceActionTypes | SourceGroupActionTypes
): PageState {
    switch(action.type) {
        case ADD_SOURCE:
            switch (action.status) {
                case ActionStatus.Success: return {
                    ...state,
                    sourceGroups: [
                        ...state.sourceGroups,
                        new SourceGroup([action.source.sid])
                    ]
                }
                default: return state
            }
        case DELETE_SOURCE: return {
            ...state,
            sourceGroups: [
                ...state.sourceGroups.map(group => ({
                    ...group,
                    sids: group.sids.filter(sid => sid != action.source.sid)
                })).filter(g => g.isMultiple || g.sids.length == 1)
            ]
        }
        case SELECT_PAGE:
            switch (action.pageType) {
                case PageType.AllArticles: return {
                    ...state,
                    feedId: ALL
                }
                case PageType.Sources: return {
                    ...state,
                    feedId: SOURCE
                }
                default: return state
            }
        case CREATE_SOURCE_GROUP: return {
            ...state,
            sourceGroups: [ ...state.sourceGroups, action.group ]
        }
        case ADD_SOURCE_TO_GROUP: return {
            ...state,
            sourceGroups: state.sourceGroups.map((g, i) => i == action.groupIndex ? ({
                ...g,
                sids: [ ...g.sids, action.sid ]
            }) : g).filter(g => g.isMultiple || !g.sids.includes(action.sid) )
        }
        case REMOVE_SOURCE_FROM_GROUP: return {
            ...state,
            sourceGroups: [
                ...state.sourceGroups.slice(0, action.groupIndex),
                { 
                    ...state.sourceGroups[action.groupIndex],
                    sids: state.sourceGroups[action.groupIndex].sids.filter(sid => !action.sids.includes(sid))
                },
                ...action.sids.map(sid => new SourceGroup([sid])),
                ...state.sourceGroups.slice(action.groupIndex + 1)
            ]
        }
        case UPDATE_SOURCE_GROUP: return {
            ...state,
            sourceGroups: [ 
                ...state.sourceGroups.slice(0, action.groupIndex),
                action.group,
                ...state.sourceGroups.slice(action.groupIndex + 1)
            ]
        }
        case REORDER_SOURCE_GROUPS: return {
            ...state,
            sourceGroups: action.groups
        }
        case DELETE_SOURCE_GROUP: return {
            ...state,
            sourceGroups: [
                ...state.sourceGroups.slice(0, action.groupIndex),
                ...state.sourceGroups[action.groupIndex].sids.map(sid => new SourceGroup([sid])),
                ...state.sourceGroups.slice(action.groupIndex + 1)
            ]
        }
        default: return state
    }
}