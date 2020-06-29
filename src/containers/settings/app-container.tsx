import intl from "react-intl-universal"
import { connect } from "react-redux"
import { importAll } from "../../scripts/settings"
import { initIntl, saveSettings } from "../../scripts/models/app"
import * as db from "../../scripts/db"
import AppTab from "../../components/settings/app"
import { initFeeds } from "../../scripts/models/feed"
import { remote } from "electron"

const mapDispatchToProps = dispatch => ({
    setLanguage: (option: string) => {
        window.settings.setLocaleSettings(option)
        dispatch(initIntl())
    },
    deleteArticles: (days: number) => new Promise((resolve) => {
        dispatch(saveSettings())
        let date = new Date()
        date.setTime(date.getTime() - days * 86400000)
        db.idb.remove({ date: { $lt: date } }, { multi: true }, () => {
            dispatch(initFeeds(true)).then(() => dispatch(saveSettings()))
            db.idb.prependOnceListener("compaction.done", () => {
                resolve()
            })
            db.idb.persistence.compactDatafile()
        })
    }),
    importAll: () => {
        let window = remote.getCurrentWindow()
        remote.dialog.showOpenDialog(window, {
            filters: [{ name: intl.get("app.frData"), extensions: ["frdata"] }],
            properties: ["openFile"]
        }).then(result => {
            if (!result.canceled) {
                remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                    type: "warning",
                    title: intl.get("app.restore"),
                    message: intl.get("app.confirmImport"),
                    buttons: process.platform === "win32" ? ["Yes", "No"] : [intl.get("confirm"), intl.get("cancel")],
                    defaultId: 1,
                    cancelId: 1
                }).then(response => {
                    if (response.response === 0) {
                        dispatch(saveSettings())
                        importAll(result.filePaths[0])
                    }
                })
            }
        })
    }
})

const AppTabContainer = connect(null, mapDispatchToProps)(AppTab)
export default AppTabContainer