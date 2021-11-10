import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../../scripts/reducer"
import RulesTab from "../../components/settings/rules"
import { AppDispatch } from "../../scripts/utils"
import { RSSSource, updateSource } from "../../scripts/models/source"
import { SourceRule } from "../../scripts/models/rule"

const getSources = (state: RootState) => state.sources

const mapStateToProps = createSelector([getSources], sources => ({
    sources: sources,
}))

const mapDispatchToProps = (dispatch: AppDispatch) => ({
    updateSourceRules: (source: RSSSource, rules: SourceRule[]) => {
        source.rules = rules
        dispatch(updateSource(source))
    },
})

const RulesTabContainer = connect(mapStateToProps, mapDispatchToProps)(RulesTab)
export default RulesTabContainer
