"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rootReducer = void 0;
const redux_1 = require("redux");
const source_1 = require("./models/source");
const item_1 = require("./models/item");
const feed_1 = require("./models/feed");
const app_1 = require("./models/app");
const group_1 = require("./models/group");
const page_1 = require("./models/page");
const service_1 = require("./models/service");
exports.rootReducer = (0, redux_1.combineReducers)({
    sources: source_1.sourceReducer,
    items: item_1.itemReducer,
    feeds: feed_1.feedReducer,
    groups: group_1.groupReducer,
    page: page_1.pageReducer,
    service: service_1.serviceReducer,
    app: app_1.appReducer,
});
