"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_redux_1 = require("react-redux");
const reselect_1 = require("reselect");
const rules_1 = __importDefault(require("../../components/settings/rules"));
const source_1 = require("../../scripts/models/source");
const getSources = (state) => state.sources;
const mapStateToProps = (0, reselect_1.createSelector)([getSources], sources => ({
    sources: sources,
}));
const mapDispatchToProps = (dispatch) => ({
    updateSourceRules: (source, rules) => {
        source.rules = rules;
        dispatch((0, source_1.updateSource)(source));
    },
});
const RulesTabContainer = (0, react_redux_1.connect)(mapStateToProps, mapDispatchToProps)(rules_1.default);
exports.default = RulesTabContainer;
