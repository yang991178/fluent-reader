import * as React from "react"

interface ResizeHandleProps {
    onResize: (width: number) => void
    minWidth: number
    maxWidthPercent: number
    onDragStart?: () => void
    onDragEnd?: () => void
}

interface ResizeHandleState {
    isDragging: boolean
}

class ResizeHandle extends React.Component<ResizeHandleProps, ResizeHandleState> {
    private startX: number = 0
    private startWidth: number = 0
    private currentWidth: number = 0

    constructor(props: ResizeHandleProps) {
        super(props)
        this.state = {
            isDragging: false,
        }
    }

    componentDidMount() {
        document.addEventListener("mousemove", this.handleMouseMove)
        document.addEventListener("mouseup", this.handleMouseUp)
    }

    componentWillUnmount() {
        document.removeEventListener("mousemove", this.handleMouseMove)
        document.removeEventListener("mouseup", this.handleMouseUp)
    }

    handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        this.startX = e.clientX

        // Get the current width of the list-feed-container
        const listFeedContainer = document.querySelector(".list-feed-container") as HTMLElement
        if (listFeedContainer) {
            this.startWidth = listFeedContainer.offsetWidth
            this.currentWidth = this.startWidth
        }

        this.setState({ isDragging: true })

        // Notify parent that drag started
        if (this.props.onDragStart) {
            this.props.onDragStart()
        }
    }

    handleMouseMove = (e: MouseEvent) => {
        if (!this.state.isDragging) return

        e.preventDefault()

        const delta = e.clientX - this.startX
        const newWidth = this.startWidth + delta

        // Get the main container to calculate max width
        const mainContainer = document.querySelector(".list-main") as HTMLElement
        if (!mainContainer) return

        const maxWidth = mainContainer.offsetWidth * (this.props.maxWidthPercent / 100)

        // Constrain width between min and max
        const constrainedWidth = Math.max(
            this.props.minWidth,
            Math.min(maxWidth, newWidth)
        )

        // Store current width but don't persist yet
        this.currentWidth = constrainedWidth

        // Apply width directly to the DOM for smooth visual feedback
        const listFeedContainer = document.querySelector(".list-feed-container") as HTMLElement
        if (listFeedContainer) {
            listFeedContainer.style.width = `${constrainedWidth}px`
        }
    }

    handleMouseUp = () => {
        if (this.state.isDragging) {
            this.setState({ isDragging: false })

            // Only persist the final width after drag is complete
            this.props.onResize(this.currentWidth)

            // Notify parent that drag ended
            if (this.props.onDragEnd) {
                this.props.onDragEnd()
            }
        }
    }

    render() {
        return (
            <div
                className={`resize-handle ${this.state.isDragging ? "dragging" : ""}`}
                onMouseDown={this.handleMouseDown}>
                <div className="resize-handle-icon" />
            </div>
        )
    }
}

export default ResizeHandle
