import { contextBridge } from "electron"
import settingsBridge from "./bridges/settings"
import utilsBridge from "./bridges/utils"

window.settings = settingsBridge
window.utils = utilsBridge