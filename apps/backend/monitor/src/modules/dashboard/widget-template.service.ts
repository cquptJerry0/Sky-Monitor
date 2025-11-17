import { Injectable, NotFoundException } from '@nestjs/common'
import { WIDGET_TEMPLATES } from './widget-templates.config'
import type { WidgetTemplate, WidgetTemplateMeta, WidgetTemplateType, TemplateParams, TemplateListResponse } from './widget-template.types'
import type { QueryConfig } from '../../entities/dashboard-widget.entity'

@Injectable()
export class WidgetTemplateService {
    /**
     * 获取所有模板列表
     */
    getAllTemplates(): TemplateListResponse {
        const templates: WidgetTemplateMeta[] = Object.values(WIDGET_TEMPLATES).map(template => ({
            type: template.type,
            name: template.name,
            description: template.description,
            category: template.category,
            widgetType: template.widgetType,
            icon: template.icon,
            editableParams: template.editableParams,
        }))

        return { templates }
    }

    /**
     * 根据类型获取模板
     */
    getTemplateByType(type: WidgetTemplateType): WidgetTemplate {
        const template = WIDGET_TEMPLATES[type]
        if (!template) {
            throw new NotFoundException(`Template type "${type}" not found`)
        }
        return template
    }

    /**
     * 根据分类获取模板列表
     */
    getTemplatesByCategory(category: string): WidgetTemplateMeta[] {
        return Object.values(WIDGET_TEMPLATES)
            .filter(template => template.category === category)
            .map(template => ({
                type: template.type,
                name: template.name,
                description: template.description,
                category: template.category,
                widgetType: template.widgetType,
                icon: template.icon,
                editableParams: template.editableParams,
            }))
    }

    /**
     * 从模板生成查询配置
     */
    generateQueryFromTemplate(type: WidgetTemplateType, params: TemplateParams): QueryConfig[] {
        const template = this.getTemplateByType(type)
        return template.generateQuery(params)
    }

    /**
     * 验证模板参数
     */
    validateTemplateParams(type: WidgetTemplateType, params: TemplateParams): { valid: boolean; errors: string[] } {
        const template = this.getTemplateByType(type)
        const errors: string[] = []

        // 验证 appId
        if (!params.appId || (Array.isArray(params.appId) && params.appId.length === 0)) {
            errors.push('appId is required')
        }

        // 验证 timeGranularity
        if (template.editableParams?.timeGranularity?.enabled && params.timeGranularity) {
            const validOptions = template.editableParams.timeGranularity.options
            if (!validOptions.includes(params.timeGranularity)) {
                errors.push(`Invalid timeGranularity: ${params.timeGranularity}. Valid options: ${validOptions.join(', ')}`)
            }
        }

        // 验证 limit
        if (template.editableParams?.limit?.enabled && params.limit !== undefined) {
            const { min, max } = template.editableParams.limit
            if (params.limit < min || params.limit > max) {
                errors.push(`limit must be between ${min} and ${max}`)
            }
        }

        return {
            valid: errors.length === 0,
            errors,
        }
    }
}
