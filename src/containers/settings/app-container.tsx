import { connect } from "react-redux"
import { initIntl, saveSettings, setupAutoFetch } from "../../scripts/models/app"
import * as db from "../../scripts/db"
import AppTab from "../../components/settings/app"
import { importAll } from "../../scripts/settings"
import { updateUnreadCounts } from "../../scripts/models/source"
import { AppDispatch } from "../../scripts/utils"

const mapDispatchToProps = (dispatch: AppDispatch) => ({
    setLanguage: (option: string) => {
        window.settings.setLocaleSettings(option)
        dispatch(initIntl())
    },
    setFetchInterval: (interval: number) => {
        window.settings.setFetchInterval(interval)
        dispatch(setupAutoFetch())
    },
    deleteArticles: (days: number) => new Promise((resolve) => {
        dispatch(saveSettings())
        let date = new Date()
        date.setTime(date.getTime() - days * 86400000)
        db.idb.remove({ date: { $lt: date } }, { multi: true }, () => {
            dispatch(updateUnreadCounts()).then(() => dispatch(saveSettings()))
            db.idb.prependOnceListener("compaction.done", resolve)
            db.idb.persistence.compactDatafile()
        })
    }),
    importAll: async () => {
        dispatch(saveSettings())
        let cancelled =  await importAll()
        if (cancelled) dispatch(saveSettings())
    }
})

const AppTabContainer = connect(null, mapDispatchToProps)(AppTab)
export default AppTabContainer