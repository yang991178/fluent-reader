"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedContainer = void 0;
const react_redux_1 = require("react-redux");
const reselect_1 = require("reselect");
const item_1 = require("../scripts/models/item");
const app_1 = require("../scripts/models/app");
const feed_1 = require("../scripts/models/feed");
const page_1 = require("../scripts/models/page");
const feed_2 = require("../components/feeds/feed");
const getSources = (state) => state.sources;
const getItems = (state) => state.items;
const getFeed = (state, props) => state.feeds[props.feedId];
const getFilter = (state) => state.page.filter;
const getView = (_, props) => props.viewType;
const getViewConfigs = (state) => state.page.viewConfigs;
const getCurrentItem = (state) => state.page.itemId;
const makeMapStateToProps = () => {
    return (0, reselect_1.createSelector)([
        getSources,
        getItems,
        getFeed,
        getView,
        getFilter,
        getViewConfigs,
        getCurrentItem,
    ], (sources, items, feed, viewType, filter, viewConfigs, currentItem) => ({
        feed: feed,
        items: feed.iids.map(iid => items[iid]),
        sourceMap: sources,
        filter: filter,
        viewType: viewType,
        viewConfigs: viewConfigs,
        currentItem: currentItem,
    }));
};
const mapDispatchToProps = dispatch => {
    return {
        shortcuts: (item, e) => dispatch((0, item_1.itemShortcuts)(item, e)),
        markRead: (item) => dispatch((0, item_1.markRead)(item)),
        contextMenu: (feedId, item, e) => dispatch((0, app_1.openItemMenu)(item, feedId, e)),
        loadMore: (feed) => dispatch((0, feed_1.loadMore)(feed)),
        showItem: (fid, item) => dispatch((0, page_1.showItem)(fid, item)),
    };
};
const connector = (0, react_redux_1.connect)(makeMapStateToProps, mapDispatchToProps);
exports.FeedContainer = connector(feed_2.Feed);
