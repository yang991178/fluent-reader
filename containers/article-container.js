"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_redux_1 = require("react-redux");
const reselect_1 = require("reselect");
const item_1 = require("../scripts/models/item");
const page_1 = require("../scripts/models/page");
const article_1 = __importDefault(require("../components/article"));
const app_1 = require("../scripts/models/app");
const getItem = (state, props) => state.items[props.itemId];
const getSource = (state, props) => state.sources[state.items[props.itemId].source];
const getLocale = (state) => state.app.locale;
const makeMapStateToProps = () => {
    return (0, reselect_1.createSelector)([getItem, getSource, getLocale], (item, source, locale) => ({
        item: item,
        source: source,
        locale: locale,
    }));
};
const mapDispatchToProps = (dispatch) => {
    return {
        shortcuts: (item, e) => dispatch((0, item_1.itemShortcuts)(item, e)),
        dismiss: () => dispatch((0, page_1.dismissItem)()),
        offsetItem: (offset) => dispatch((0, page_1.showOffsetItem)(offset)),
        toggleHasRead: (item) => dispatch(item.hasRead ? (0, item_1.markUnread)(item) : (0, item_1.markRead)(item)),
        toggleStarred: (item) => dispatch((0, item_1.toggleStarred)(item)),
        toggleHidden: (item) => {
            if (!item.hidden)
                dispatch((0, page_1.dismissItem)());
            if (!item.hasRead && !item.hidden)
                dispatch((0, item_1.markRead)(item));
            dispatch((0, item_1.toggleHidden)(item));
        },
        textMenu: (position, text, url) => dispatch((0, app_1.openTextMenu)(position, text, url)),
        imageMenu: (position) => dispatch((0, app_1.openImageMenu)(position)),
        dismissContextMenu: () => dispatch((0, app_1.closeContextMenu)()),
    };
};
const ArticleContainer = (0, react_redux_1.connect)(makeMapStateToProps, mapDispatchToProps)(article_1.default);
exports.default = ArticleContainer;
