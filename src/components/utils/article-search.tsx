import * as React from "react"
import intl = require("react-intl-universal")
import { connect } from "react-redux"
import { RootState } from "../../scripts/reducer"
import { SearchBox, IRefObject, ISearchBox } from "@fluentui/react"
import { AppDispatch } from "../../scripts/utils"
import { performSearch } from "../../scripts/models/page"

class Debounced {
    public use = (func: (...args: any[]) => any, delay: number): ((...args: any[]) => void) => {
        let timer: NodeJS.Timeout
        return (...args: any[]) => {
            clearTimeout(timer)
            timer = setTimeout(() => {
                func.apply(this, args)
            }, delay)
        }
    }
}

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
        this.debouncedSearch = new Debounced().use((query: string) => props.dispatch(performSearch(query)), 750)
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