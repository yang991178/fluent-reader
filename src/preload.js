"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const settings_1 = __importDefault(require("./bridges/settings"));
const utils_1 = __importDefault(require("./bridges/utils"));
electron_1.contextBridge.exposeInMainWorld("settings", settings_1.default);
electron_1.contextBridge.exposeInMainWorld("utils", utils_1.default);
