import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../../scripts/reducer"
import SourcesTab from "../../components/settings/sources"
import { addSource } from "../../scripts/models/source"

const getSources = (state: RootState) => state.sources

const mapStateToProps = createSelector(
    [getSources],
    (sources) => ({
        sources: sources
    })
)

const mapDispatchToProps = dispatch => {
    return { 
        addSource: (url: string) => dispatch(addSource(url))
    }
}

const connector = connect(mapStateToProps, mapDispatchToProps)
export type SourcesTabReduxProps = typeof connector
export const SourcesTabContainer = connector(SourcesTab)