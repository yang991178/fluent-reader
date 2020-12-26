import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../../scripts/reducer"
import { ServiceTab } from "../../components/settings/service"
import { AppDispatch } from "../../scripts/utils"
import { ServiceConfigs } from "../../schema-types"
import { saveServiceConfigs, getServiceHooksFromType, removeService, syncWithService } from "../../scripts/models/service"
import { saveSettings } from "../../scripts/models/app"

const getService = (state: RootState) => state.service

const mapStateToProps = createSelector(
    [getService],
    (service) => ({
        configs: service
    })
)

const mapDispatchToProps = (dispatch: AppDispatch) => ({
    save: (configs: ServiceConfigs) => dispatch(saveServiceConfigs(configs)),
    remove: () => dispatch(removeService()),
    blockActions: () => dispatch(saveSettings()),
    sync: () => dispatch(syncWithService()),
    authenticate: async (configs: ServiceConfigs) => {
        const hooks = getServiceHooksFromType(configs.type)
        if (hooks.authenticate) return await hooks.authenticate(configs)
        else return true
    },
    reauthenticate: async (configs: ServiceConfigs) => {
        const hooks = getServiceHooksFromType(configs.type)
        try {
            if (hooks.reauthenticate) return await hooks.reauthenticate(configs)
        } catch (err) {
            console.log(err)
            return configs
        }
    }
})

const ServiceTabContainer = connect(mapStateToProps, mapDispatchToProps)(ServiceTab)
export default ServiceTabContainer