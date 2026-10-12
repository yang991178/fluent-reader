import * as React from "react"
import { useEffect, useState } from "react"
import intl from "react-intl-universal"
import { Button, Input, Text } from "@fluentui/react-components"
import { RuleTarget } from "../../../schema-types"
import { ArticleRule } from "../../../scripts/models/rule"
import { RSSItem } from "../../../scripts/models/item"
import { RSSSource } from "../../../scripts/models/source"
import { MyParserItem } from "../../../scripts/utils"
import { useStyles } from "./styles"

type RulePreviewProps = {
    target: RuleTarget
    rules: ArticleRule[]
    saving: boolean
}

export function RulePreview({ target, rules, saving }: RulePreviewProps) {
    const classes = useStyles()
    const [mockTitle, setMockTitle] = useState("")
    const [mockCreator, setMockCreator] = useState("")
    const [mockContent, setMockContent] = useState("")
    const [mockResult, setMockResult] = useState("")
    useEffect(() => setMockResult(""), [rules])
    function testRules() {
        const source = {
            sid: target.type === "source" ? target.sid : -1,
        } as RSSSource
        const item = new RSSItem(
            { title: mockTitle, creator: mockCreator } as MyParserItem,
            source
        )
        item.snippet = mockContent
        ArticleRule.applyAll(rules, item)
        const result = [
            intl.get(item.hasRead ? "article.markRead" : "article.markUnread"),
        ]
        if (item.starred) result.push(intl.get("article.star"))
        if (item.hidden) result.push(intl.get("article.hide"))
        if (item.notify) result.push(intl.get("article.notify"))
        setMockResult(result.join(", "))
    }

    return (
        <fieldset className={classes.fieldset} disabled={saving}>
            <Text weight="semibold">{intl.get("rules.test")}</Text>
            <div className={classes.row}>
                <Input
                    className={classes.grow}
                    aria-label={intl.get("rules.title")}
                    placeholder={intl.get("rules.title")}
                    value={mockTitle}
                    onChange={(_, data) => setMockTitle(data.value)}
                />
                <Input
                    className={classes.grow}
                    aria-label={intl.get("rules.creator")}
                    placeholder={intl.get("rules.creator")}
                    value={mockCreator}
                    onChange={(_, data) => setMockCreator(data.value)}
                />
            </div>
            <div className={classes.row}>
                <Input
                    className={classes.grow}
                    aria-label={intl.get("rules.content")}
                    placeholder={intl.get("rules.content")}
                    value={mockContent}
                    onChange={(_, data) => setMockContent(data.value)}
                />
                <Button appearance="primary" onClick={testRules}>
                    {intl.get("rules.test")}
                </Button>
            </div>
            <Text
                role="status"
                data-testid="rules-test-result"
                className={classes.hint}>
                {mockResult}
            </Text>
        </fieldset>
    )
}
