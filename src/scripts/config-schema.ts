import { ThemeSettings } from "./settings"
import { SourceGroup } from "./models/group"

// Using schema breaks unsafe-eval. Unused.
/* export const schema: {[key in keyof schemaTypes]: Schema} = {
    theme: { type: "string", default: "system" },
    pac: { type: "string", default: "" },
    pacOn: { type: "boolean", default: false },
    view: { type: "number", default: 0 },
    locale: { type: "string", default: "default" },
    sourceGroups: { type: "array", default: [] }
} */

export type schemaTypes = {
    theme: ThemeSettings
    pac: string
    pacOn: boolean
    view: number
    locale: string
    sourceGroups: SourceGroup[]
    fontSize: number
}
