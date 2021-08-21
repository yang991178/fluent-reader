import * as React from "react"
import intl from "react-intl-universal"
import { connect } from "react-redux"
import { RootState } from "../../scripts/reducer"
import { SearchBox, ISearchBox, Async } from "@fluentui/react"
import { AppDispatch, validateRegex } from "../../scripts/utils"
import { performSearch } from "../../scripts/models/page"

type SearchProps = {
    searchOn: boolean
    initQuery: string
    dispatch: AppDispatch
}

type SearchState = {
    query: string
}

class ArticleSearch extends React.Component<SearchProps, SearchState> {
    debouncedSearch: (query: string) => void
    inputRef: React.RefObject<ISearchBox>

    constructor(props: SearchProps) {
        super(props)
        this.debouncedSearch = new Async().debounce((query: string) => {
            let regex = validateRegex(query)
            if (regex !== null) props.dispatch(performSearch(query))
        }, 750)
        this.inputRef = React.createRef<ISearchBox>()
        this.state = { query: props.initQuery }
    }

    onSearchChange = (_, newValue: string) => {
        this.debouncedSearch(newValue)
        this.setState({ query: newValue })
    }

    componentDidUpdate(prevProps: SearchProps) {
        if (this.props.searchOn && !prevProps.searchOn) {
            this.setState({ query: this.props.initQuery })
            this.inputRef.current.focus()
        }
    }

    render() {
        return (
            this.props.searchOn && (
                <SearchBox
                    componentRef={this.inputRef}
                    className="article-search"
                    placeholder={intl.get("search")}
                    value={this.state.query}
                    onChange={this.onSearchChange}
                />
            )
        )
    }
}

const getSearchProps = (state: RootState) => ({
    searchOn: state.page.searchOn,
    initQuery: state.page.filter.search,
})
export default connect(getSearchProps)(ArticleSearch)
