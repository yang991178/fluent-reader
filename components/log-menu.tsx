import * as React from "react"
import intl from "react-intl-universal"
import {
    Callout,
    ActivityItem,
    Icon,
    DirectionalHint,
    Link,
} from "@fluentui/react"
import { AppLog, AppLogType } from "../scripts/models/app"
import Time from "./utils/time"

type LogMenuProps = {
    display: boolean
    logs: AppLog[]
    close: () => void
    showItem: (iid: number) => void
}

function getLogIcon(log: AppLog) {
    switch (log.type) {
        case AppLogType.Info:
            return "Info"
        case AppLogType.Article:
            return "KnowledgeArticle"
        default:
            return "Warning"
    }
}

class LogMenu extends React.Component<LogMenuProps> {
    activityItems = () =>
        this.props.logs
            .map((l, i) => ({
                key: i,
                activityDescription: l.iid ? (
                    <b>
                        <Link onClick={() => this.handleArticleClick(l)}>
                            {l.title}
                        </Link>
                    </b>
                ) : (
                    <b>{l.title}</b>
                ),
                comments: l.details,
                activityIcon: <Icon iconName={getLogIcon(l)} />,
                timeStamp: <Time date={l.time} />,
            }))
            .reverse()

    handleArticleClick = (log: AppLog) => {
        this.props.close()
        this.props.showItem(log.iid)
    }

    render() {
        return (
            this.props.display && (
                <Callout
                    target="#log-toggle"
                    role="log-menu"
                    directionalHint={DirectionalHint.bottomCenter}
                    calloutWidth={320}
                    calloutMaxHeight={240}
                    onDismiss={this.props.close}>
                    {this.props.logs.length == 0 ? (
                        <p style={{ textAlign: "center" }}>
                            {intl.get("log.empty")}
                        </p>
                    ) : (
                        this.activityItems().map(item => (
                            <ActivityItem
                                {...item}
                                key={item.key}
                                style={{ margin: 12 }}
                            />
                        ))
                    )}
                </Callout>
            )
        )
    }
}

export default LogMenu
