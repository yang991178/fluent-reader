import { ServiceHooks } from "../service"
import { ServiceConfigs } from "../../../schema-types"

export interface FeverConfigs extends ServiceConfigs {
    endpoint: string
    username: string
    password: string
    apiKey: string
    lastId?: number
}

async function fetchAPI(configs: FeverConfigs, params="") {
    const response = await fetch(configs.endpoint + params, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: `api_key=${configs.apiKey}`
    })
    return await response.json()
}

export const feverServiceHooks: ServiceHooks = {
    authenticate: async (configs: FeverConfigs) => {
        try {
            return Boolean((await fetchAPI(configs)).auth)
        } catch {
            return false
        }
    }
}