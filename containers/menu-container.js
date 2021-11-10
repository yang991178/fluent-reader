"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_redux_1 = require("react-redux");
const reselect_1 = require("reselect");
const menu_1 = require("../components/menu");
const app_1 = require("../scripts/models/app");
const group_1 = require("../scripts/models/group");
const page_1 = require("../scripts/models/page");
const feed_1 = require("../scripts/models/feed");
const getApp = (state) => state.app;
const getSources = (state) => state.sources;
const getGroups = (state) => state.groups;
const getSearchOn = (state) => state.page.searchOn;
const getItemOn = (state) => state.page.itemId !== null && state.page.viewType !== 1 /* List */;
const mapStateToProps = (0, reselect_1.createSelector)([getApp, getSources, getGroups, getSearchOn, getItemOn], (app, sources, groups, searchOn, itemOn) => ({
    status: app.sourceInit && !app.settings.display,
    display: app.menu,
    selected: app.menuKey,
    sources: sources,
    groups: groups.map((g, i) => ({ ...g, index: i })),
    searchOn: searchOn,
    itemOn: itemOn,
}));
const mapDispatchToProps = dispatch => ({
    toggleMenu: () => dispatch((0, app_1.toggleMenu)()),
    allArticles: (init = false) => {
        dispatch((0, page_1.selectAllArticles)(init)), dispatch((0, feed_1.initFeeds)());
    },
    selectSourceGroup: (group, menuKey) => {
        dispatch((0, page_1.selectSources)(group.sids, menuKey, group.name));
        dispatch((0, feed_1.initFeeds)());
    },
    selectSource: (source) => {
        dispatch((0, page_1.selectSources)([source.sid], "s-" + source.sid, source.name));
        dispatch((0, feed_1.initFeeds)());
    },
    groupContextMenu: (sids, event) => {
        dispatch((0, app_1.openGroupMenu)(sids, event));
    },
    updateGroupExpansion: (event, key, selected) => {
        if (event.target.tagName === "I" || key === selected) {
            let [type, index] = key.split("-");
            if (type === "g")
                dispatch((0, group_1.toggleGroupExpansion)(parseInt(index)));
        }
    },
    toggleSearch: () => dispatch((0, page_1.toggleSearch)()),
});
const MenuContainer = (0, react_redux_1.connect)(mapStateToProps, mapDispatchToProps)(menu_1.Menu);
exports.default = MenuContainer;
