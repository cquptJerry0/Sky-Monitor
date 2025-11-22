import { useMutation, useQueryClient } from '@tanstack/react-query'

import { widgetTemplateApi } from '@/api/widget-template'
import type { CreateWidgetFromTemplateDto } from '@/types/dashboard'

/**
 * 从模版创建Widget
 * 简化版本 - 只支持大数字模版
 */
export function useCreateWidgetFromTemplate() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateWidgetFromTemplateDto) => widgetTemplateApi.createWidgetFromTemplate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboards'] })
        },
    })
}
