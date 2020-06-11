import intl = require("react-intl-universal")
import { remote } from "electron"
import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../../scripts/reducer"
import SourcesTab from "../../components/settings/sources"
import { addSource, RSSSource, updateSource, deleteSource, SourceOpenTarget } from "../../scripts/models/source"
import { importOPML } from "../../scripts/models/group"
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
        deleteSource: (source: RSSSource) => dispatch(deleteSource(source)),
        importOPML: () => {
            let path = remote.dialog.showOpenDialogSync(
                remote.getCurrentWindow(),
                {
                    filters: [{ name: intl.get("sources.opmlFile"), extensions: ["xml", "opml"] }],
                    properties: ["openFile"]
                }
            )
            if (path && path.length > 0) dispatch(importOPML(path[0]))
        }
    }
}

 const SourcesTabContainer = connect(mapStateToProps, mapDispatchToProps)(SourcesTab)
 export default SourcesTabContainer