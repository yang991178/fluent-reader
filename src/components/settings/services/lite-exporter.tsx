import * as React from "react"
import intl from "react-intl-universal"
import { Stack, ContextualMenuItemType, DefaultButton, IContextualMenuProps, DirectionalHint } from "@fluentui/react"
import { ServiceConfigs, SyncService } from "../../../schema-types"
import { renderShareQR } from "../../context-menu"
import { platformCtrl } from "../../../scripts/utils"
import { FeverConfigs } from "../../../scripts/models/services/fever"
import { GReaderConfigs } from "../../../scripts/models/services/greader"
import { FeedbinConfigs } from "../../../scripts/models/services/feedbin"

type LiteExporterProps = {
    serviceConfigs: ServiceConfigs
}

const LEARN_MORE_URL = "https://github.com/yang991178/fluent-reader/wiki/Support#mobile-app"

const LiteExporter: React.FunctionComponent<LiteExporterProps> = (props) => {
    let url = "https://hyliu.me/fr2l/?"
    const params = new URLSearchParams()
    switch (props.serviceConfigs.type) {
        case SyncService.Fever: {
            const configs = props.serviceConfigs as FeverConfigs
            params.set("t", "f")
            params.set("e", configs.endpoint)
            params.set("u", configs.username)
            params.set("k", configs.apiKey)
            break
        }
        case SyncService.GReader:
        case SyncService.Inoreader: {
            const configs = props.serviceConfigs as GReaderConfigs
            params.set("t", configs.type == SyncService.GReader ? "g" : "i")
            params.set("e", configs.endpoint)
            params.set("u", configs.username)
            params.set("p", btoa(configs.password))
            if (configs.inoreaderId) {
                params.set("i", configs.inoreaderId)
                params.set("k", configs.inoreaderKey)
            }
            break
        }
        case SyncService.Feedbin: {
            const configs = props.serviceConfigs as FeedbinConfigs
            params.set("t", "fb")
            params.set("e", configs.endpoint)
            params.set("u", configs.username)
            params.set("p", btoa(configs.password))
            break
        }
    }
    url += params.toString()
    const menuProps: IContextualMenuProps = {
        directionalHint: DirectionalHint.bottomCenter,
        items: [
            { key: "qr", url: url, onRender: renderShareQR },
            { key: "divider_1", itemType: ContextualMenuItemType.Divider },
            {
                key: "openInBrowser",
                text: intl.get("rules.help"),
                iconProps: { iconName: "NavigateExternalInline" },
                onClick: e => { window.utils.openExternal(LEARN_MORE_URL, platformCtrl(e)) }
            },
        ]
    }
    return <Stack style={{marginTop: 32}}>
        <DefaultButton
            text={intl.get("service.exportToLite")}
            onRenderMenuIcon={() => <></>}
            menuProps={menuProps} />
    </Stack>
}

export default LiteExporter