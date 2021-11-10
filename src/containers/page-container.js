"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_redux_1 = require("react-redux");
const reselect_1 = require("reselect");
const page_1 = __importDefault(require("../components/page"));
const page_2 = require("../scripts/models/page");
const getPage = (state) => state.page;
const getSettings = (state) => state.app.settings.display;
const getMenu = (state) => state.app.menu;
const getContext = (state) => state.app.contextMenu.type != 0 /* Hidden */;
const mapStateToProps = (0, reselect_1.createSelector)([getPage, getSettings, getMenu, getContext], (page, settingsOn, menuOn, contextOn) => ({
    feeds: [page.feedId],
    settingsOn: settingsOn,
    menuOn: menuOn,
    contextOn: contextOn,
    itemId: page.itemId,
    itemFromFeed: page.itemFromFeed,
    viewType: page.viewType,
}));
const mapDispatchToProps = (dispatch) => ({
    dismissItem: () => dispatch((0, page_2.dismissItem)()),
    offsetItem: (offset) => dispatch((0, page_2.showOffsetItem)(offset)),
});
const PageContainer = (0, react_redux_1.connect)(mapStateToProps, mapDispatchToProps)(page_1.default);
exports.default = PageContainer;
