"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMainTouchBar = void 0;
const electron_1 = require("electron");
function createTouchBarFunctionButton(window, text, key) {
    return new electron_1.TouchBar.TouchBarButton({
        label: text,
        click: () => window.webContents.send("touchbar-event", key),
    });
}
function initMainTouchBar(texts, window) {
    const touchBar = new electron_1.TouchBar({
        items: [
            createTouchBarFunctionButton(window, texts.menu, "F1"),
            createTouchBarFunctionButton(window, texts.search, "F2"),
            new electron_1.TouchBar.TouchBarSpacer({ size: "small" }),
            createTouchBarFunctionButton(window, texts.refresh, "F5"),
            createTouchBarFunctionButton(window, texts.markAll, "F6"),
            createTouchBarFunctionButton(window, texts.notifications, "F7"),
        ],
    });
    window.setTouchBar(touchBar);
}
exports.initMainTouchBar = initMainTouchBar;
