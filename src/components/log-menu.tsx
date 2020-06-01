import * as React from "react"
import { Callout, ActivityItem, Icon, DirectionalHint } from "@fluentui/react"
import { AppLog, AppLogType } from "../scripts/models/app"
import { LogsReduxProps } from "../containers/log-menu-container"
import Time from "./utils/time"

type LogMenuProps = LogsReduxProps & {
    display: boolean,
    logs: AppLog[]
    close: Function
}

class LogMenu extends React.Component<LogMenuProps> {
    activityItems = () => this.props.logs.map((l, i) => ({
        key: i,
        activityDescription: <b>{l.title}</b>,
        comments: l.details,
        activityIcon: <Icon iconName={l.type == AppLogType.Info ? "Info" : "Warning"} />,
        timeStamp: <Time date={l.time} />,
    })).reverse()

    render () {
        return this.props.display && ( 
            <Callout
                target="#log-toggle"
                role="log-menu"
                directionalHint={DirectionalHint.bottomCenter}
                calloutWidth={320}
                calloutMaxHeight={240}
                onDismiss={() => this.props.close()}
            >
                { this.props.logs.length == 0 
                ? <p style={{ textAlign: "center" }}>无消息</p>
                : this.activityItems().map((item => (
                    <ActivityItem {...item} key={item.key} style={{ margin: 12 }} />
                ))) }
            </Callout>
        )
    }
}

export default LogMenu