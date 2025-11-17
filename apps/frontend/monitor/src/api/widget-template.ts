import type { CreateWidgetFromTemplateDto, TemplateListResponse, WidgetTemplateMeta, WidgetTemplateType } from '@/types/dashboard'

import { client } from './client'

export const widgetTemplateApi = {
    getTemplates: async (category?: string): Promise<TemplateListResponse> => {
        const params = category ? { category } : {}
        return await client.get<TemplateListResponse>('/dashboards/templates', { params })
    },

    getTemplateByType: async (type: WidgetTemplateType): Promise<WidgetTemplateMeta> => {
        return await client.get<WidgetTemplateMeta>(`/dashboards/templates/${type}`)
    },

    createWidgetFromTemplate: async (data: CreateWidgetFromTemplateDto) => {
        return await client.post('/dashboards/widgets/from-template', data)
    },
}
