"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_redux_1 = require("react-redux");
const reselect_1 = require("reselect");
const app_1 = require("../scripts/models/app");
const log_menu_1 = __importDefault(require("../components/log-menu"));
const page_1 = require("../scripts/models/page");
const getLogs = (state) => state.app.logMenu;
const mapStateToProps = (0, reselect_1.createSelector)(getLogs, logs => logs);
const mapDispatchToProps = dispatch => {
    return {
        close: () => dispatch((0, app_1.toggleLogMenu)()),
        showItem: (iid) => dispatch((0, page_1.showItemFromId)(iid)),
    };
};
const LogMenuContainer = (0, react_redux_1.connect)(mapStateToProps, mapDispatchToProps)(log_menu_1.default);
exports.default = LogMenuContainer;
