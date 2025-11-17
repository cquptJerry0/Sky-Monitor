import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { widgetTemplateApi } from '@/api/widget-template'
import type { CreateWidgetFromTemplateDto, TemplateCategory, WidgetTemplateType } from '@/types/dashboard'

const templateKeys = {
    all: ['widget-templates'] as const,
    lists: () => [...templateKeys.all, 'list'] as const,
    list: (category?: TemplateCategory) => [...templateKeys.lists(), category] as const,
    details: () => [...templateKeys.all, 'detail'] as const,
    detail: (type: WidgetTemplateType) => [...templateKeys.details(), type] as const,
}

export function useWidgetTemplates(category?: TemplateCategory) {
    return useQuery({
        queryKey: templateKeys.list(category),
        queryFn: () => widgetTemplateApi.getTemplates(category),
    })
}

export function useWidgetTemplate(type: WidgetTemplateType | null) {
    return useQuery({
        queryKey: templateKeys.detail(type || ('web_vitals_trend' as WidgetTemplateType)),
        queryFn: () => widgetTemplateApi.getTemplateByType(type!),
        enabled: !!type,
    })
}

export function useCreateWidgetFromTemplate() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateWidgetFromTemplateDto) => widgetTemplateApi.createWidgetFromTemplate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboards'] })
        },
    })
}
