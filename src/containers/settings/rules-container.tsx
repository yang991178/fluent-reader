import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../../scripts/reducer"
import RulesTab from "../../components/settings/rules"
import { AppDispatch } from "../../scripts/utils"
import { RSSSource, updateSourceDone } from "../../scripts/models/source"
import { SourceRule } from "../../scripts/models/rule"

const getSources = (state: RootState) => state.sources

const mapStateToProps = createSelector([getSources], sources => ({
    sources: sources,
}))

const mapDispatchToProps = (dispatch: AppDispatch) => ({
    updateSourceRules: (source: RSSSource, rules: SourceRule[]) => {
        globalThis.settings.setRulesForTarget(
            { type: "source", sid: source.sid },
            rules.map(SourceRule.toStored)
        )
        dispatch(updateSourceDone({ ...source, rules }))
    },
})

const RulesTabContainer = connect(mapStateToProps, mapDispatchToProps)(RulesTab)
export default RulesTabContainer
