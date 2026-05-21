import { connect } from "react-redux"
import {
    initIntl,
    saveSettings,
    setupAutoFetch,
} from "../../scripts/models/app"
import { database, itemsTable } from "../../scripts/db"
import { lt } from "drizzle-orm"
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
    deleteArticles: async (days: number) => {
        dispatch(saveSettings())
        let date = new Date()
        date.setTime(date.getTime() - days * 86400000)
        await database.delete(itemsTable).where(lt(itemsTable.date, date))
        await dispatch(updateUnreadCounts())
        dispatch(saveSettings())
    },
    importAll: async () => {
        dispatch(saveSettings())
        let cancelled = await importAll()
        if (cancelled) dispatch(saveSettings())
    },
})

const AppTabContainer = connect(null, mapDispatchToProps)(AppTab)
export default AppTabContainer
