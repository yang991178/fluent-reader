import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../../scripts/reducer"
import SourcesTab from "../../components/settings/sources"
import { addSource, RSSSource, updateSource, deleteSource } from "../../scripts/models/source"

const getSources = (state: RootState) => state.sources

const mapStateToProps = createSelector(
    [getSources],
    (sources) => ({
        sources: sources
    })
)

const mapDispatchToProps = dispatch => {
    return { 
        addSource: (url: string) => dispatch(addSource(url)),
        updateSourceName: (source: RSSSource, name: string) => {
            dispatch(updateSource({ ...source, name: name } as RSSSource))
        },
        deleteSource: (source: RSSSource) => dispatch(deleteSource(source))
    }
}

const connector = connect(mapStateToProps, mapDispatchToProps)
export type SourcesTabReduxProps = typeof connector
export const SourcesTabContainer = connector(SourcesTab)