import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../../scripts/reducer"
import SourcesTab from "../../components/settings/sources"
import { addSource, RSSSource, updateSource, deleteSource, SourceOpenTarget, deleteSources } from "../../scripts/models/source"
import { importOPML, exportOPML } from "../../scripts/models/group"
import { AppDispatch } from "../../scripts/utils"

const getSources = (state: RootState) => state.sources

const mapStateToProps = createSelector(
    [getSources],
    (sources) => ({
        sources: sources
    })
)

const mapDispatchToProps = (dispatch: AppDispatch) => {
    return { 
        addSource: (url: string) => dispatch(addSource(url)),
        updateSourceName: (source: RSSSource, name: string) => {
            dispatch(updateSource({ ...source, name: name } as RSSSource))
        },
        updateSourceOpenTarget: (source: RSSSource, target: SourceOpenTarget) => {
            dispatch(updateSource({ ...source, openTarget: target } as RSSSource))
        },
        updateFetchFrequency: (source: RSSSource, frequency: number) => {
            dispatch(updateSource({ ...source, fetchFrequency: frequency } as RSSSource))
        },
        deleteSource: (source: RSSSource) => dispatch(deleteSource(source)),
        deleteSources: (sources: RSSSource[]) => dispatch(deleteSources(sources)),
        importOPML: () => dispatch(importOPML()),
        exportOPML: () => dispatch(exportOPML())
    }
}

 const SourcesTabContainer = connect(mapStateToProps, mapDispatchToProps)(SourcesTab)
 export default SourcesTabContainer