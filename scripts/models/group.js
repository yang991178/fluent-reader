"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupReducer = exports.exportOPML = exports.importOPML = exports.fixBrokenGroups = exports.toggleGroupExpansion = exports.reorderSourceGroups = exports.updateSourceGroup = exports.deleteSourceGroup = exports.removeSourceFromGroup = exports.addSourceToGroup = exports.createSourceGroup = exports.createSourceGroupDone = exports.TOGGLE_GROUP_EXPANSION = exports.DELETE_SOURCE_GROUP = exports.REORDER_SOURCE_GROUPS = exports.UPDATE_SOURCE_GROUP = exports.REMOVE_SOURCE_FROM_GROUP = exports.ADD_SOURCE_TO_GROUP = exports.CREATE_SOURCE_GROUP = void 0;
const react_intl_universal_1 = __importDefault(require("react-intl-universal"));
const source_1 = require("./source");
const schema_types_1 = require("../../schema-types");
const utils_1 = require("../utils");
const app_1 = require("./app");
const item_1 = require("./item");
exports.CREATE_SOURCE_GROUP = "CREATE_SOURCE_GROUP";
exports.ADD_SOURCE_TO_GROUP = "ADD_SOURCE_TO_GROUP";
exports.REMOVE_SOURCE_FROM_GROUP = "REMOVE_SOURCE_FROM_GROUP";
exports.UPDATE_SOURCE_GROUP = "UPDATE_SOURCE_GROUP";
exports.REORDER_SOURCE_GROUPS = "REORDER_SOURCE_GROUPS";
exports.DELETE_SOURCE_GROUP = "DELETE_SOURCE_GROUP";
exports.TOGGLE_GROUP_EXPANSION = "TOGGLE_GROUP_EXPANSION";
function createSourceGroupDone(group) {
    return {
        type: exports.CREATE_SOURCE_GROUP,
        group: group,
    };
}
exports.createSourceGroupDone = createSourceGroupDone;
function createSourceGroup(name) {
    return (dispatch, getState) => {
        let groups = getState().groups;
        for (let i = 0; i < groups.length; i += 1) {
            const g = groups[i];
            if (g.isMultiple && g.name === name) {
                return i;
            }
        }
        let group = new schema_types_1.SourceGroup([], name);
        dispatch(createSourceGroupDone(group));
        groups = getState().groups;
        window.settings.saveGroups(groups);
        return groups.length - 1;
    };
}
exports.createSourceGroup = createSourceGroup;
function addSourceToGroupDone(groupIndex, sid) {
    return {
        type: exports.ADD_SOURCE_TO_GROUP,
        groupIndex: groupIndex,
        sid: sid,
    };
}
function addSourceToGroup(groupIndex, sid) {
    return (dispatch, getState) => {
        dispatch(addSourceToGroupDone(groupIndex, sid));
        window.settings.saveGroups(getState().groups);
    };
}
exports.addSourceToGroup = addSourceToGroup;
function removeSourceFromGroupDone(groupIndex, sids) {
    return {
        type: exports.REMOVE_SOURCE_FROM_GROUP,
        groupIndex: groupIndex,
        sids: sids,
    };
}
function removeSourceFromGroup(groupIndex, sids) {
    return (dispatch, getState) => {
        dispatch(removeSourceFromGroupDone(groupIndex, sids));
        window.settings.saveGroups(getState().groups);
    };
}
exports.removeSourceFromGroup = removeSourceFromGroup;
function deleteSourceGroupDone(groupIndex) {
    return {
        type: exports.DELETE_SOURCE_GROUP,
        groupIndex: groupIndex,
    };
}
function deleteSourceGroup(groupIndex) {
    return (dispatch, getState) => {
        dispatch(deleteSourceGroupDone(groupIndex));
        window.settings.saveGroups(getState().groups);
    };
}
exports.deleteSourceGroup = deleteSourceGroup;
function updateSourceGroupDone(group) {
    return {
        type: exports.UPDATE_SOURCE_GROUP,
        groupIndex: group.index,
        group: group,
    };
}
function updateSourceGroup(group) {
    return (dispatch, getState) => {
        dispatch(updateSourceGroupDone(group));
        window.settings.saveGroups(getState().groups);
    };
}
exports.updateSourceGroup = updateSourceGroup;
function reorderSourceGroupsDone(groups) {
    return {
        type: exports.REORDER_SOURCE_GROUPS,
        groups: groups,
    };
}
function reorderSourceGroups(groups) {
    return (dispatch, getState) => {
        dispatch(reorderSourceGroupsDone(groups));
        window.settings.saveGroups(getState().groups);
    };
}
exports.reorderSourceGroups = reorderSourceGroups;
function toggleGroupExpansion(groupIndex) {
    return (dispatch, getState) => {
        dispatch({
            type: exports.TOGGLE_GROUP_EXPANSION,
            groupIndex: groupIndex,
        });
        window.settings.saveGroups(getState().groups);
    };
}
exports.toggleGroupExpansion = toggleGroupExpansion;
function fixBrokenGroups(sources) {
    return (dispatch, getState) => {
        const { groups } = getState();
        const sids = new Set(Object.values(sources).map(s => s.sid));
        let isBroken = false;
        const newGroups = groups
            .map(group => {
            const newGroup = {
                ...group,
                sids: group.sids.filter(sid => sids.delete(sid)),
            };
            if (newGroup.sids.length !== group.sids.length) {
                isBroken = true;
            }
            return newGroup;
        })
            .filter(group => group.isMultiple || group.sids.length > 0);
        if (isBroken || sids.size > 0) {
            for (let sid of sids) {
                newGroups.push(new schema_types_1.SourceGroup([sid]));
            }
            dispatch(reorderSourceGroups(newGroups));
        }
    };
}
exports.fixBrokenGroups = fixBrokenGroups;
function outlineToSource(outline) {
    let url = outline.getAttribute("xmlUrl");
    let name = outline.getAttribute("text") || outline.getAttribute("title");
    if (url) {
        return [(0, source_1.addSource)(url.trim(), name, true), url];
    }
    else {
        return null;
    }
}
function importOPML() {
    return async (dispatch) => {
        const filters = [
            { name: react_intl_universal_1.default.get("sources.opmlFile"), extensions: ["xml", "opml"] },
        ];
        window.utils.showOpenDialog(filters).then(data => {
            if (data) {
                dispatch((0, app_1.saveSettings)());
                let doc = utils_1.domParser
                    .parseFromString(data, "text/xml")
                    .getElementsByTagName("body");
                if (doc.length == 0) {
                    dispatch((0, app_1.saveSettings)());
                    return;
                }
                let parseError = doc[0].getElementsByTagName("parsererror");
                if (parseError.length > 0) {
                    dispatch((0, app_1.saveSettings)());
                    window.utils.showErrorBox(react_intl_universal_1.default.get("sources.errorParse"), react_intl_universal_1.default.get("sources.errorParseHint"));
                    return;
                }
                let sources = [];
                let errors = [];
                for (let el of doc[0].children) {
                    if (el.getAttribute("type") === "rss") {
                        let source = outlineToSource(el);
                        if (source)
                            sources.push([source[0], -1, source[1]]);
                    }
                    else if (el.hasAttribute("text") ||
                        el.hasAttribute("title")) {
                        let groupName = el.getAttribute("text") || el.getAttribute("title");
                        let gid = dispatch(createSourceGroup(groupName));
                        for (let child of el.children) {
                            let source = outlineToSource(child);
                            if (source)
                                sources.push([source[0], gid, source[1]]);
                        }
                    }
                }
                dispatch((0, item_1.fetchItemsRequest)(sources.length));
                let promises = sources.map(([s, gid, url]) => {
                    return dispatch(s)
                        .then(sid => {
                        if (sid !== null && gid > -1)
                            dispatch(addSourceToGroup(gid, sid));
                    })
                        .catch(err => {
                        errors.push([url, err]);
                    })
                        .finally(() => {
                        dispatch((0, item_1.fetchItemsIntermediate)());
                    });
                });
                Promise.allSettled(promises).then(() => {
                    dispatch((0, item_1.fetchItemsSuccess)([], {}));
                    dispatch((0, app_1.saveSettings)());
                    if (errors.length > 0) {
                        window.utils.showErrorBox(react_intl_universal_1.default.get("sources.errorImport", {
                            count: errors.length,
                        }), errors
                            .map(e => {
                            return e[0] + "\n" + String(e[1]);
                        })
                            .join("\n"));
                    }
                });
            }
        });
    };
}
exports.importOPML = importOPML;
function sourceToOutline(source, xml) {
    let outline = xml.createElement("outline");
    outline.setAttribute("text", source.name);
    outline.setAttribute("title", source.name);
    outline.setAttribute("type", "rss");
    outline.setAttribute("xmlUrl", source.url);
    return outline;
}
function exportOPML() {
    return (_, getState) => {
        const filters = [
            { name: react_intl_universal_1.default.get("sources.opmlFile"), extensions: ["opml"] },
        ];
        window.utils
            .showSaveDialog(filters, "*/Fluent_Reader_Export.opml")
            .then(write => {
            if (write) {
                let state = getState();
                let xml = utils_1.domParser.parseFromString('<?xml version="1.0" encoding="UTF-8"?><opml version="1.0"><head><title>Fluent Reader Export</title></head><body></body></opml>', "text/xml");
                let body = xml.getElementsByTagName("body")[0];
                for (let group of state.groups) {
                    if (group.isMultiple) {
                        let outline = xml.createElement("outline");
                        outline.setAttribute("text", group.name);
                        outline.setAttribute("title", group.name);
                        for (let sid of group.sids) {
                            outline.appendChild(sourceToOutline(state.sources[sid], xml));
                        }
                        body.appendChild(outline);
                    }
                    else {
                        body.appendChild(sourceToOutline(state.sources[group.sids[0]], xml));
                    }
                }
                let serializer = new XMLSerializer();
                write(serializer.serializeToString(xml), react_intl_universal_1.default.get("settings.writeError"));
            }
        });
    };
}
exports.exportOPML = exportOPML;
function groupReducer(state = window.settings.loadGroups(), action) {
    switch (action.type) {
        case source_1.ADD_SOURCE:
            switch (action.status) {
                case utils_1.ActionStatus.Success:
                    return [...state, new schema_types_1.SourceGroup([action.source.sid])];
                default:
                    return state;
            }
        case source_1.DELETE_SOURCE:
            return [
                ...state
                    .map(group => ({
                    ...group,
                    sids: group.sids.filter(sid => sid != action.source.sid),
                }))
                    .filter(g => g.isMultiple || g.sids.length == 1),
            ];
        case exports.CREATE_SOURCE_GROUP:
            return [...state, action.group];
        case exports.ADD_SOURCE_TO_GROUP:
            return state
                .map((g, i) => ({
                ...g,
                sids: i == action.groupIndex
                    ? [
                        ...g.sids.filter(sid => sid !== action.sid),
                        action.sid,
                    ]
                    : g.sids.filter(sid => sid !== action.sid),
            }))
                .filter(g => g.isMultiple || g.sids.length > 0);
        case exports.REMOVE_SOURCE_FROM_GROUP:
            return [
                ...state.slice(0, action.groupIndex),
                {
                    ...state[action.groupIndex],
                    sids: state[action.groupIndex].sids.filter(sid => !action.sids.includes(sid)),
                },
                ...action.sids.map(sid => new schema_types_1.SourceGroup([sid])),
                ...state.slice(action.groupIndex + 1),
            ];
        case exports.UPDATE_SOURCE_GROUP:
            return [
                ...state.slice(0, action.groupIndex),
                action.group,
                ...state.slice(action.groupIndex + 1),
            ];
        case exports.REORDER_SOURCE_GROUPS:
            return action.groups;
        case exports.DELETE_SOURCE_GROUP:
            return [
                ...state.slice(0, action.groupIndex),
                ...state[action.groupIndex].sids.map(sid => new schema_types_1.SourceGroup([sid])),
                ...state.slice(action.groupIndex + 1),
            ];
        case exports.TOGGLE_GROUP_EXPANSION:
            return state.map((g, i) => i == action.groupIndex
                ? {
                    ...g,
                    expanded: !g.expanded,
                }
                : g);
        default:
            return state;
    }
}
exports.groupReducer = groupReducer;
