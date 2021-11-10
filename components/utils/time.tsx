import * as React from "react"
import intl from "react-intl-universal"

interface TimeProps {
    date: Date
}

class Time extends React.Component<TimeProps> {
    timerID: NodeJS.Timeout
    state = { now: new Date() }

    componentDidMount() {
        this.timerID = setInterval(() => this.tick(), 60000)
    }

    componentWillUnmount() {
        clearInterval(this.timerID)
    }

    tick() {
        this.setState({ now: new Date() })
    }

    displayTime(past: Date, now: Date): string {
        // difference in seconds
        let diff = (now.getTime() - past.getTime()) / 60000
        if (diff < 1) return intl.get("time.now")
        else if (diff < 60) return Math.floor(diff) + intl.get("time.m")
        else if (diff < 1440) return Math.floor(diff / 60) + intl.get("time.h")
        else return Math.floor(diff / 1440) + intl.get("time.d")
    }

    render() {
        return (
            <span className="time">
                {this.displayTime(this.props.date, this.state.now)}
            </span>
        )
    }
}

export default Time
