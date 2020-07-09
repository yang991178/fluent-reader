import { connect } from "react-redux"
import { initIntl, saveSettings, setupAutoFetch } from "../../scripts/models/app"
import * as db from "../../scripts/db"
import AppTab from "../../components/settings/app"
import { initFeeds } from "../../scripts/models/feed"
import { importAll } from "../../scripts/settings"

const mapDispatchToProps = dispatch => ({
    setLanguage: (option: string) => {
        window.settings.setLocaleSettings(option)
        dispatch(initIntl())
    },
    setFetchInteval: (inteval: number) => {
        window.settings.setFetchInteval(inteval)
        dispatch(setupAutoFetch())
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
    importAll: async () => {
        dispatch(saveSettings())
        let cancelled =  await importAll()
        if (cancelled) dispatch(saveSettings())
    }
})

const AppTabContainer = connect(null, mapDispatchToProps)(AppTab)
export default AppTabContainer