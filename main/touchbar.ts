import { TouchBarTexts } from "../schema-types"
import { BrowserWindow, TouchBar } from "electron"

function createTouchBarFunctionButton(
    window: BrowserWindow,
    text: string,
    key: string
) {
    return new TouchBar.TouchBarButton({
        label: text,
        click: () => window.webContents.send("touchbar-event", key),
    })
}

export function initMainTouchBar(texts: TouchBarTexts, window: BrowserWindow) {
    const touchBar = new TouchBar({
        items: [
            createTouchBarFunctionButton(window, texts.menu, "F1"),
            createTouchBarFunctionButton(window, texts.search, "F2"),
            new TouchBar.TouchBarSpacer({ size: "small" }),
            createTouchBarFunctionButton(window, texts.refresh, "F5"),
            createTouchBarFunctionButton(window, texts.markAll, "F6"),
            createTouchBarFunctionButton(window, texts.notifications, "F7"),
        ],
    })
    window.setTouchBar(touchBar)
}
