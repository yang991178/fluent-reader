import * as React from "react"
import intl from "react-intl-universal"
import { PrimaryButton } from "@fluentui/react"

class DangerButton extends PrimaryButton {
    timerID: NodeJS.Timeout

    state = {
        confirming: false,
    }

    clear = () => {
        this.timerID = null
        this.setState({ confirming: false })
    }

    onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (!this.props.disabled) {
            if (this.state.confirming) {
                if (this.props.onClick) this.props.onClick(event)
                clearTimeout(this.timerID)
                this.clear()
            } else {
                this.setState({ confirming: true })
                this.timerID = setTimeout(() => {
                    this.clear()
                }, 5000)
            }
        }
    }

    componentWillUnmount() {
        if (this.timerID) clearTimeout(this.timerID)
    }

    render = () => (
        <PrimaryButton
            {...this.props}
            className={this.props.className + " danger"}
            onClick={this.onClick}
            text={
                this.state.confirming
                    ? intl.get("dangerButton", {
                          action: this.props.text.toLowerCase(),
                      })
                    : this.props.text
            }>
            {this.props.children}
        </PrimaryButton>
    )
}

export default DangerButton
