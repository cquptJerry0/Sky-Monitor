import type { CreateWidgetFromTemplateDto, TemplateListResponse } from '@/types/dashboard'

import { client } from './client'

export const widgetTemplateApi = {
    getTemplates: async (): Promise<TemplateListResponse> => {
        return await client.get<TemplateListResponse>('/dashboards/templates')
    },

    createWidgetFromTemplate: async (data: CreateWidgetFromTemplateDto) => {
        return await client.post('/dashboards/widgets/from-template', data)
    },
}
