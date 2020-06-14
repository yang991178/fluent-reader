import * as React from "react"
import intl = require("react-intl-universal")
import { connect } from "react-redux"
import { RootState } from "../../scripts/reducer"
import { SearchBox, ISearchBox, Async } from "@fluentui/react"
import { AppDispatch } from "../../scripts/utils"
import { performSearch } from "../../scripts/models/page"

type SearchProps = {
    searchOn: boolean
    initQuery: string
    dispatch: AppDispatch
}

class ArticleSearch extends React.Component<SearchProps> {
    debouncedSearch: (query: string) => void
    inputRef: React.RefObject<ISearchBox>

    constructor(props: SearchProps) {
        super(props)
        this.debouncedSearch = new Async().debounce((query: string) => {
            try {
                RegExp(query)
                props.dispatch(performSearch(query))
            } catch {
                // console.log("Invalid regex")
            }
        }, 750)
        this.inputRef = React.createRef<ISearchBox>()
    }

    onSearchChange = (_, newValue: string) => {
        this.debouncedSearch(newValue)
    }

    componentDidUpdate(prevProps: SearchProps) {
        if (this.props.searchOn && !prevProps.searchOn) {
            this.inputRef.current.focus()
        }
    }

    render() {
        return this.props.searchOn && (
            <SearchBox 
                componentRef={this.inputRef}
                className="article-search"
                placeholder={intl.get("search")}
                defaultValue={this.props.initQuery}
                onChange={this.onSearchChange} />
        )
    }
}

const getSearchProps = (state: RootState) => ({
    searchOn: state.page.searchOn,
    initQuery: state.page.filter.search
})
export default connect(getSearchProps)(ArticleSearch)