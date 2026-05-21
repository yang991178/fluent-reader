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
        const allRules = globalThis.settings.getSourceRules()
        const filtered = allRules.filter(
            r => !(r.target.type === "source" && r.target.sid === source.sid)
        )
        const newRules = rules.map((r, i) =>
            SourceRule.toStored(
                r,
                { type: "source", sid: source.sid },
                `${source.sid}-${i}`
            )
        )
        globalThis.settings.setSourceRules([...filtered, ...newRules])
        dispatch(updateSourceDone({ ...source, rules }))
    },
})

const RulesTabContainer = connect(mapStateToProps, mapDispatchToProps)(RulesTab)
export default RulesTabContainer
