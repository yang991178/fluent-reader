import { contextBridge } from "electron"
import settingsBridge from "./bridges/settings"
import utilsBridge from "./bridges/utils"
import dbBridge from "./bridges/db"

contextBridge.exposeInMainWorld("settings", settingsBridge)
contextBridge.exposeInMainWorld("utils", utilsBridge)
contextBridge.exposeInMainWorld("db", dbBridge)
