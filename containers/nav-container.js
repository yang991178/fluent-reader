"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_redux_1 = require("react-redux");
const reselect_1 = require("reselect");
const item_1 = require("../scripts/models/item");
const app_1 = require("../scripts/models/app");
const page_1 = require("../scripts/models/page");
const nav_1 = __importDefault(require("../components/nav"));
const getState = (state) => state.app;
const getItemShown = (state) => state.page.itemId && state.page.viewType !== 1 /* List */;
const mapStateToProps = (0, reselect_1.createSelector)([getState, getItemShown], (state, itemShown) => ({
    state: state,
    itemShown: itemShown,
}));
const mapDispatchToProps = dispatch => ({
    fetch: () => dispatch((0, item_1.fetchItems)()),
    menu: () => dispatch((0, app_1.toggleMenu)()),
    logs: () => dispatch((0, app_1.toggleLogMenu)()),
    views: () => dispatch((0, app_1.openViewMenu)()),
    settings: () => dispatch((0, app_1.toggleSettings)()),
    search: () => dispatch((0, page_1.toggleSearch)()),
    markAllRead: () => dispatch((0, app_1.openMarkAllMenu)()),
});
const NavContainer = (0, react_redux_1.connect)(mapStateToProps, mapDispatchToProps)(nav_1.default);
exports.default = NavContainer;
