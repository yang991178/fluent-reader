import { contextBridge } from "electron"
import SettingsBridge from "./bridges/settings"

window.settings = SettingsBridge