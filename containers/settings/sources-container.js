"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_intl_universal_1 = __importDefault(require("react-intl-universal"));
const react_redux_1 = require("react-redux");
const reselect_1 = require("reselect");
const sources_1 = __importDefault(require("../../components/settings/sources"));
const source_1 = require("../../scripts/models/source");
const group_1 = require("../../scripts/models/group");
const utils_1 = require("../../scripts/utils");
const app_1 = require("../../scripts/models/app");
const getSources = (state) => state.sources;
const getServiceOn = (state) => state.service.type !== 0 /* None */;
const getSIDs = (state) => state.app.settings.sids;
const mapStateToProps = (0, reselect_1.createSelector)([getSources, getServiceOn, getSIDs], (sources, serviceOn, sids) => ({
    sources: sources,
    serviceOn: serviceOn,
    sids: sids,
}));
const mapDispatchToProps = (dispatch) => {
    return {
        acknowledgeSIDs: () => dispatch((0, app_1.toggleSettings)(true)),
        addSource: (url) => dispatch((0, source_1.addSource)(url)),
        updateSourceName: (source, name) => {
            dispatch((0, source_1.updateSource)({ ...source, name: name }));
        },
        updateSourceIcon: async (source, iconUrl) => {
            dispatch((0, app_1.saveSettings)());
            if (await (0, utils_1.validateFavicon)(iconUrl)) {
                dispatch((0, source_1.updateSource)({ ...source, iconurl: iconUrl }));
            }
            else {
                window.utils.showErrorBox(react_intl_universal_1.default.get("sources.badIcon"), "");
            }
            dispatch((0, app_1.saveSettings)());
        },
        updateSourceOpenTarget: (source, target) => {
            dispatch((0, source_1.updateSource)({ ...source, openTarget: target }));
        },
        updateFetchFrequency: (source, frequency) => {
            dispatch((0, source_1.updateSource)({
                ...source,
                fetchFrequency: frequency,
            }));
        },
        deleteSource: (source) => dispatch((0, source_1.deleteSource)(source)),
        deleteSources: (sources) => dispatch((0, source_1.deleteSources)(sources)),
        importOPML: () => dispatch((0, group_1.importOPML)()),
        exportOPML: () => dispatch((0, group_1.exportOPML)()),
    };
};
const SourcesTabContainer = (0, react_redux_1.connect)(mapStateToProps, mapDispatchToProps)(sources_1.default);
exports.default = SourcesTabContainer;
