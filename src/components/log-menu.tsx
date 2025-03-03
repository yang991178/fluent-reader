import * as React from "react"
import intl from "react-intl-universal"
import {
    Callout,
    ActivityItem,
    Icon,
    DirectionalHint,
    Link,
} from "@fluentui/react"
import { AppLog, AppLogType, toggleLogMenu } from "../scripts/models/app"
import Time from "./utils/time"
import { useAppDispatch, useAppSelector } from "../scripts/reducer"
import { showItemFromId } from "../scripts/models/page"

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

function LogMenu() {
    const dispatch = useAppDispatch()
    const { display, logs } = useAppSelector(state => state.app.logMenu)

    return (
        display && (
            <Callout
                target="#log-toggle"
                role="log-menu"
                directionalHint={DirectionalHint.bottomCenter}
                calloutWidth={320}
                calloutMaxHeight={240}
                onDismiss={() => dispatch(toggleLogMenu())}>
                {logs.length == 0 ? (
                    <p style={{ textAlign: "center" }}>
                        {intl.get("log.empty")}
                    </p>
                ) : (
                    logs
                        .map((l, i) => (
                            <ActivityItem
                                activityDescription={
                                    l.iid ? (
                                        <b>
                                            <Link
                                                onClick={() => {
                                                    dispatch(toggleLogMenu())
                                                    dispatch(
                                                        showItemFromId(l.iid)
                                                    )
                                                }}>
                                                {l.title}
                                            </Link>
                                        </b>
                                    ) : (
                                        <b>{l.title}</b>
                                    )
                                }
                                comments={l.details}
                                activityIcon={<Icon iconName={getLogIcon(l)} />}
                                timeStamp={<Time date={l.time} />}
                                key={i}
                                style={{ margin: 12 }}
                            />
                        ))
                        .reverse()
                )}
            </Callout>
        )
    )
}

export default LogMenu
