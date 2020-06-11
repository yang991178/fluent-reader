import { connect } from "react-redux"
import { setLocaleSettings } from "../../scripts/settings"
import { initIntl } from "../../scripts/models/app"
import AppTab from "../../components/settings/app"

const mapDispatchToProps = dispatch => ({
    setLanguage: (option: string) => {
        setLocaleSettings(option)
        dispatch(initIntl())
    }
})

const AppTabContainer = connect(null, mapDispatchToProps)(AppTab)
export default AppTabContainer