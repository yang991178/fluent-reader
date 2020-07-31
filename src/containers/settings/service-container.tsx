import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../../scripts/reducer"
import { ServiceTab } from "../../components/settings/service"
import { AppDispatch } from "../../scripts/utils"

const getService = (state: RootState) => state.service

const mapStateToProps = createSelector(
    [getService],
    (service) => ({
        configs: service
    })
)

const mapDispatchToProps = (dispatch: AppDispatch) => ({
    
})

const ServiceTabContainer = connect(mapStateToProps, mapDispatchToProps)(ServiceTab)
export default ServiceTabContainer