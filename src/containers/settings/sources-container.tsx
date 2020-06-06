import { remote } from "electron"
import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../../scripts/reducer"
import SourcesTab from "../../components/settings/sources"
import { addSource, RSSSource, updateSource, deleteSource } from "../../scripts/models/source"
import { importOPML } from "../../scripts/models/group"

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
        deleteSource: (source: RSSSource) => dispatch(deleteSource(source)),
        importOPML: () => {
            let path = remote.dialog.showOpenDialogSync(
                remote.getCurrentWindow(),
                {
                    filters: [{ name: "OPML文件", extensions: ["xml", "opml"] }],
                    properties: ["openFile"]
                }
            )
            if (path.length > 0) dispatch(importOPML(path[0]))
        }
    }
}

 const SourcesTabContainer = connect(mapStateToProps, mapDispatchToProps)(SourcesTab)
 export default SourcesTabContainer