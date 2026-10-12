import intl from "react-intl-universal"
import {
    SourceActionTypes,
    ADD_SOURCE,
    DELETE_SOURCE,
    addSource,
    RSSSource,
    SourceState,
} from "./source"
import { SourceGroup } from "../../schema-types"
import { ActionStatus, AppThunk, domParser } from "../utils"
import { saveSettings } from "./app"
import { updateRulesForTarget } from "./rule"
import {
    fetchItemsIntermediate,
    fetchItemsRequest,
    fetchItemsSuccess,
} from "./item"

export const CREATE_SOURCE_GROUP = "CREATE_SOURCE_GROUP"
export const ADD_SOURCE_TO_GROUP = "ADD_SOURCE_TO_GROUP"
export const REMOVE_SOURCE_FROM_GROUP = "REMOVE_SOURCE_FROM_GROUP"
export const UPDATE_SOURCE_GROUP = "UPDATE_SOURCE_GROUP"
export const REORDER_SOURCE_GROUPS = "REORDER_SOURCE_GROUPS"
export const DELETE_SOURCE_GROUP = "DELETE_SOURCE_GROUP"
export const TOGGLE_GROUP_EXPANSION = "TOGGLE_GROUP_EXPANSION"

interface CreateSourceGroupAction {
    type: typeof CREATE_SOURCE_GROUP
    group: SourceGroup
}

interface AddSourceToGroupAction {
    type: typeof ADD_SOURCE_TO_GROUP
    gid: number
    sid: number
}

interface RemoveSourceFromGroupAction {
    type: typeof REMOVE_SOURCE_FROM_GROUP
    gid: number
    sids: number[]
    groups: SourceGroup[]
}

interface UpdateSourceGroupAction {
    type: typeof UPDATE_SOURCE_GROUP
    group: SourceGroup
}

interface ReorderSourceGroupsAction {
    type: typeof REORDER_SOURCE_GROUPS
    groups: SourceGroup[]
}

interface DeleteSourceGroupAction {
    type: typeof DELETE_SOURCE_GROUP
    gid: number
    groups: SourceGroup[]
}

interface ToggleGroupExpansionAction {
    type: typeof TOGGLE_GROUP_EXPANSION
    gid: number
}

export type SourceGroupActionTypes =
    | CreateSourceGroupAction
    | AddSourceToGroupAction
    | RemoveSourceFromGroupAction
    | UpdateSourceGroupAction
    | ReorderSourceGroupsAction
    | DeleteSourceGroupAction
    | ToggleGroupExpansionAction

export function createSourceGroupDone(
    group: SourceGroup
): SourceGroupActionTypes {
    return {
        type: CREATE_SOURCE_GROUP,
        group: group,
    }
}

export function createSourceGroup(name: string): AppThunk<number> {
    return (dispatch, getState) => {
        let groups = getState().groups
        for (let i = 0; i < groups.length; i += 1) {
            const g = groups[i]
            if (g.isMultiple && g.name === name) {
                return g.gid
            }
        }
        const group = new SourceGroup(
            window.settings.allocateGroupId(),
            [],
            name
        )
        dispatch(createSourceGroupDone(group))
        groups = getState().groups
        window.settings.saveGroups(groups)
        return group.gid
    }
}

function addSourceToGroupDone(
    gid: number,
    sid: number
): SourceGroupActionTypes {
    return {
        type: ADD_SOURCE_TO_GROUP,
        gid: gid,
        sid: sid,
    }
}

export function addSourceToGroup(gid: number, sid: number): AppThunk {
    return (dispatch, getState) => {
        dispatch(addSourceToGroupDone(gid, sid))
        window.settings.saveGroups(getState().groups)
    }
}

function removeSourceFromGroupDone(
    gid: number,
    sids: number[]
): SourceGroupActionTypes {
    return {
        type: REMOVE_SOURCE_FROM_GROUP,
        gid: gid,
        sids: sids,
        groups: sids.map(
            sid => new SourceGroup(window.settings.allocateGroupId(), [sid])
        ),
    }
}

export function removeSourceFromGroup(gid: number, sids: number[]): AppThunk {
    return (dispatch, getState) => {
        const group = getState().groups.find(g => g.gid === gid)
        if (!group?.isMultiple) return
        dispatch(
            removeSourceFromGroupDone(
                gid,
                sids.filter(sid => group.sids.includes(sid))
            )
        )
        window.settings.saveGroups(getState().groups)
    }
}

function deleteSourceGroupDone(group: SourceGroup): SourceGroupActionTypes {
    return {
        type: DELETE_SOURCE_GROUP,
        gid: group.gid,
        groups: group.sids.map(
            sid => new SourceGroup(window.settings.allocateGroupId(), [sid])
        ),
    }
}

export function deleteSourceGroup(gid: number): AppThunk<Promise<void>> {
    return async (dispatch, getState) => {
        const group = getState().groups.find(g => g.gid === gid)
        if (!group?.isMultiple) return
        dispatch(saveSettings())
        try {
            await dispatch(
                updateRulesForTarget({ type: "group", gid: group.gid }, [])
            )
            const current = getState().groups.find(g => g.gid === gid)
            if (current) dispatch(deleteSourceGroupDone(current))
            await window.settings.saveGroups(getState().groups)
        } catch (err) {
            window.utils.showErrorBox(
                intl.get("settings.writeError"),
                String(err)
            )
        } finally {
            dispatch(saveSettings())
        }
    }
}

function updateSourceGroupDone(group: SourceGroup): SourceGroupActionTypes {
    return {
        type: UPDATE_SOURCE_GROUP,
        group: group,
    }
}

export function updateSourceGroup(group: SourceGroup): AppThunk {
    return (dispatch, getState) => {
        dispatch(updateSourceGroupDone(group))
        window.settings.saveGroups(getState().groups)
    }
}

function reorderSourceGroupsDone(
    groups: SourceGroup[]
): SourceGroupActionTypes {
    return {
        type: REORDER_SOURCE_GROUPS,
        groups: groups,
    }
}

export function reorderSourceGroups(groups: SourceGroup[]): AppThunk {
    return (dispatch, getState) => {
        dispatch(reorderSourceGroupsDone(groups))
        window.settings.saveGroups(getState().groups)
    }
}

export function toggleGroupExpansion(gid: number): AppThunk {
    return (dispatch, getState) => {
        dispatch({
            type: TOGGLE_GROUP_EXPANSION,
            gid: gid,
        })
        window.settings.saveGroups(getState().groups)
    }
}

export function fixBrokenGroups(sources: SourceState): AppThunk {
    return (dispatch, getState) => {
        const { groups } = getState()
        const sids = new Set(Object.values(sources).map(s => s.sid))
        let isBroken = false
        const newGroups: SourceGroup[] = groups
            .map(group => {
                const newGroup: SourceGroup = {
                    ...group,
                    sids: group.sids.filter(sid => sids.delete(sid)),
                }
                if (newGroup.sids.length !== group.sids.length) {
                    isBroken = true
                }
                return newGroup
            })
            .filter(group => group.isMultiple || group.sids.length > 0)
        if (isBroken || sids.size > 0) {
            for (let sid of sids) {
                newGroups.push(
                    new SourceGroup(window.settings.allocateGroupId(), [sid])
                )
            }
            dispatch(reorderSourceGroups(newGroups))
        }
    }
}

function outlineToSource(
    outline: Element
): [ReturnType<typeof addSource>, string] {
    let url = outline.getAttribute("xmlUrl")
    let name = outline.getAttribute("text") || outline.getAttribute("title")
    if (url) {
        return [addSource(url.trim(), name, true), url]
    } else {
        return null
    }
}

export function importOPML(): AppThunk {
    return async dispatch => {
        const filters = [
            { name: intl.get("sources.opmlFile"), extensions: ["xml", "opml"] },
        ]
        window.utils.showOpenDialog(filters).then(data => {
            if (data) {
                dispatch(saveSettings())
                let doc = domParser
                    .parseFromString(data, "text/xml")
                    .getElementsByTagName("body")
                if (doc.length == 0) {
                    dispatch(saveSettings())
                    return
                }
                let parseError = doc[0].getElementsByTagName("parsererror")
                if (parseError.length > 0) {
                    dispatch(saveSettings())
                    window.utils.showErrorBox(
                        intl.get("sources.errorParse"),
                        intl.get("sources.errorParseHint")
                    )
                    return
                }
                let sources: [ReturnType<typeof addSource>, number, string][] =
                    []
                let errors: [string, any][] = []
                for (let el of doc[0].children) {
                    if (el.getAttribute("type") === "rss") {
                        let source = outlineToSource(el)
                        if (source) sources.push([source[0], -1, source[1]])
                    } else if (
                        el.hasAttribute("text") ||
                        el.hasAttribute("title")
                    ) {
                        let groupName =
                            el.getAttribute("text") || el.getAttribute("title")
                        let gid = dispatch(createSourceGroup(groupName))
                        for (let child of el.children) {
                            let source = outlineToSource(child)
                            if (source)
                                sources.push([source[0], gid, source[1]])
                        }
                    }
                }
                dispatch(fetchItemsRequest(sources.length))
                let promises = sources.map(([s, gid, url]) => {
                    return dispatch(s)
                        .then(sid => {
                            if (sid !== null && gid > -1)
                                dispatch(addSourceToGroup(gid, sid))
                        })
                        .catch(err => {
                            errors.push([url, err])
                        })
                        .finally(() => {
                            dispatch(fetchItemsIntermediate())
                        })
                })
                Promise.allSettled(promises).then(() => {
                    dispatch(fetchItemsSuccess([], {}))
                    dispatch(saveSettings())
                    if (errors.length > 0) {
                        window.utils.showErrorBox(
                            intl.get("sources.errorImport", {
                                count: errors.length,
                            }),
                            errors
                                .map(e => {
                                    return e[0] + "\n" + String(e[1])
                                })
                                .join("\n"),
                            intl.get("context.copy")
                        )
                    }
                })
            }
        })
    }
}

function sourceToOutline(source: RSSSource, xml: Document) {
    let outline = xml.createElement("outline")
    outline.setAttribute("text", source.name)
    outline.setAttribute("title", source.name)
    outline.setAttribute("type", "rss")
    outline.setAttribute("xmlUrl", source.url)
    return outline
}

export function exportOPML(): AppThunk {
    return (_, getState) => {
        const filters = [
            { name: intl.get("sources.opmlFile"), extensions: ["opml"] },
        ]
        window.utils
            .showSaveDialog(filters, "*/Fluent_Reader_Export.opml")
            .then(write => {
                if (write) {
                    let state = getState()
                    let xml = domParser.parseFromString(
                        '<?xml version="1.0" encoding="UTF-8"?><opml version="1.0"><head><title>Fluent Reader Export</title></head><body></body></opml>',
                        "text/xml"
                    )
                    let body = xml.getElementsByTagName("body")[0]
                    for (let group of state.groups) {
                        if (group.isMultiple) {
                            let outline = xml.createElement("outline")
                            outline.setAttribute("text", group.name)
                            outline.setAttribute("title", group.name)
                            for (let sid of group.sids) {
                                outline.appendChild(
                                    sourceToOutline(state.sources[sid], xml)
                                )
                            }
                            body.appendChild(outline)
                        } else {
                            body.appendChild(
                                sourceToOutline(
                                    state.sources[group.sids[0]],
                                    xml
                                )
                            )
                        }
                    }
                    let serializer = new XMLSerializer()
                    write(
                        serializer.serializeToString(xml),
                        intl.get("settings.writeError")
                    )
                }
            })
    }
}

export type GroupState = SourceGroup[]

export function groupReducer(
    state = window.settings.loadGroups(),
    action: SourceActionTypes | SourceGroupActionTypes
): GroupState {
    switch (action.type) {
        case ADD_SOURCE:
            switch (action.status) {
                case ActionStatus.Success:
                    return [...state, action.group]
                default:
                    return state
            }
        case DELETE_SOURCE:
            return [
                ...state
                    .map(group => ({
                        ...group,
                        sids: group.sids.filter(
                            sid => sid != action.source.sid
                        ),
                    }))
                    .filter(g => g.isMultiple || g.sids.length == 1),
            ]
        case CREATE_SOURCE_GROUP:
            return [...state, action.group]
        case ADD_SOURCE_TO_GROUP:
            if (!state.some(g => g.isMultiple && g.gid === action.gid))
                return state
            return state
                .map(g => ({
                    ...g,
                    sids:
                        g.gid === action.gid
                            ? [
                                  ...g.sids.filter(sid => sid !== action.sid),
                                  action.sid,
                              ]
                            : g.sids.filter(sid => sid !== action.sid),
                }))
                .filter(g => g.isMultiple || g.sids.length > 0)
        case REMOVE_SOURCE_FROM_GROUP:
            return state.flatMap(group =>
                group.gid === action.gid
                    ? [
                          {
                              ...group,
                              sids: group.sids.filter(
                                  sid => !action.sids.includes(sid)
                              ),
                          },
                          ...action.groups,
                      ]
                    : [group]
            )
        case UPDATE_SOURCE_GROUP:
            return state.map(group =>
                group.gid === action.group.gid ? action.group : group
            )
        case REORDER_SOURCE_GROUPS:
            return action.groups
        case DELETE_SOURCE_GROUP:
            return state.flatMap(group =>
                group.gid === action.gid ? action.groups : [group]
            )
        case TOGGLE_GROUP_EXPANSION:
            return state.map(g =>
                g.gid === action.gid
                    ? {
                          ...g,
                          expanded: !g.expanded,
                      }
                    : g
            )
        default:
            return state
    }
}
