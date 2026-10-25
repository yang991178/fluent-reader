import { ViewType } from "../../../schema-types"
import { useAppSelector } from "../../../scripts/reducer"

export const useArticleOverlayOpen = () =>
    useAppSelector(
        s => s.page.itemId !== null && s.page.viewType !== ViewType.List
    )
