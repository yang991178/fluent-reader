"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextMenuContainer = void 0;
const react_redux_1 = require("react-redux");
const reselect_1 = require("reselect");
const app_1 = require("../scripts/models/app");
const context_menu_1 = require("../components/context-menu");
const item_1 = require("../scripts/models/item");
const page_1 = require("../scripts/models/page");
const getContext = (state) => state.app.contextMenu;
const getViewType = (state) => state.page.viewType;
const getFilter = (state) => state.page.filter;
const getViewConfigs = (state) => state.page.viewConfigs;
const mapStateToProps = (0, reselect_1.createSelector)([getContext, getViewType, getFilter, getViewConfigs], (context, viewType, filter, viewConfigs) => {
    switch (context.type) {
        case 1 /* Item */:
            return {
                type: context.type,
                event: context.event,
                viewConfigs: viewConfigs,
                item: context.target[0],
                feedId: context.target[1],
            };
        case 2 /* Text */:
            return {
                type: context.type,
                position: context.position,
                text: context.target[0],
                url: context.target[1],
            };
        case 3 /* View */:
            return {
                type: context.type,
                event: context.event,
                viewType: viewType,
                filter: filter.type,
            };
        case 4 /* Group */:
            return {
                type: context.type,
                event: context.event,
                sids: context.target,
            };
        case 5 /* Image */:
            return {
                type: context.type,
                position: context.position,
            };
        case 6 /* MarkRead */:
            return {
                type: context.type,
                event: context.event,
            };
        default:
            return { type: 0 /* Hidden */ };
    }
});
const mapDispatchToProps = dispatch => {
    return {
        showItem: (feedId, item) => dispatch((0, page_1.showItem)(feedId, item)),
        markRead: (item) => dispatch((0, item_1.markRead)(item)),
        markUnread: (item) => dispatch((0, item_1.markUnread)(item)),
        toggleStarred: (item) => dispatch((0, item_1.toggleStarred)(item)),
        toggleHidden: (item) => {
            if (!item.hasRead) {
                dispatch((0, item_1.markRead)(item));
                item.hasRead = true; // get around chaining error
            }
            dispatch((0, item_1.toggleHidden)(item));
        },
        switchView: (viewType) => {
            window.settings.setDefaultView(viewType);
            dispatch((0, page_1.switchView)(viewType));
        },
        setViewConfigs: (configs) => dispatch((0, page_1.setViewConfigs)(configs)),
        switchFilter: (filter) => dispatch((0, page_1.switchFilter)(filter)),
        toggleFilter: (filter) => dispatch((0, page_1.toggleFilter)(filter)),
        markAllRead: (sids, date, before) => {
            dispatch((0, item_1.markAllRead)(sids, date, before));
        },
        fetchItems: (sids) => dispatch((0, item_1.fetchItems)(false, sids)),
        settings: (sids) => dispatch((0, app_1.toggleSettings)(true, sids)),
        close: () => dispatch((0, app_1.closeContextMenu)()),
    };
};
const connector = (0, react_redux_1.connect)(mapStateToProps, mapDispatchToProps);
exports.ContextMenuContainer = connector(context_menu_1.ContextMenu);
