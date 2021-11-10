"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_redux_1 = require("react-redux");
const reselect_1 = require("reselect");
const groups_1 = __importDefault(require("../../components/settings/groups"));
const group_1 = require("../../scripts/models/group");
const service_1 = require("../../scripts/models/service");
const getSources = (state) => state.sources;
const getGroups = (state) => state.groups;
const getServiceOn = (state) => state.service.type !== 0 /* None */;
const mapStateToProps = (0, reselect_1.createSelector)([getSources, getGroups, getServiceOn], (sources, groups, serviceOn) => ({
    sources: sources,
    groups: groups.map((g, i) => ({ ...g, index: i })),
    serviceOn: serviceOn,
    key: groups.length,
}));
const mapDispatchToProps = (dispatch) => ({
    createGroup: (name) => dispatch((0, group_1.createSourceGroup)(name)),
    updateGroup: (group) => dispatch((0, group_1.updateSourceGroup)(group)),
    addToGroup: (groupIndex, sid) => dispatch((0, group_1.addSourceToGroup)(groupIndex, sid)),
    deleteGroup: (groupIndex) => dispatch((0, group_1.deleteSourceGroup)(groupIndex)),
    removeFromGroup: (groupIndex, sids) => dispatch((0, group_1.removeSourceFromGroup)(groupIndex, sids)),
    reorderGroups: (groups) => dispatch((0, group_1.reorderSourceGroups)(groups)),
    importGroups: () => dispatch((0, service_1.importGroups)()),
});
const GroupsTabContainer = (0, react_redux_1.connect)(mapStateToProps, mapDispatchToProps)(groups_1.default);
exports.default = GroupsTabContainer;
