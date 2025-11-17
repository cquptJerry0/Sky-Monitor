import { describe, it, expect } from 'vitest'

import { WidgetTemplateService } from './widget-template.service'

describe('DashboardService - 模板相关方法 (简化版)', () => {
    describe('WidgetTemplateService 集成测试', () => {
        it('应该能够获取所有模板', () => {
            const service = new WidgetTemplateService()
            const result = service.getAllTemplates()

            expect(result).toHaveProperty('templates')
            expect(result.templates.length).toBe(5)
        })

        it('应该能够按分类获取模板', () => {
            const service = new WidgetTemplateService()
            const templates = service.getTemplatesByCategory('performance')

            expect(templates.length).toBeGreaterThan(0)
            templates.forEach(template => {
                expect(template.category).toBe('performance')
            })
        })

        it('应该能够生成查询配置', () => {
            const service = new WidgetTemplateService()
            const queries = service.generateQueryFromTemplate('web_vitals_trend', {
                appId: 'test-app',
                timeGranularity: 'hour',
            })

            expect(queries.length).toBe(6)
            expect(queries[0].id).toBe('lcp')
        })

        it('应该能够验证模板参数', () => {
            const service = new WidgetTemplateService()
            const result = service.validateTemplateParams('web_vitals_trend', {
                appId: 'test-app',
                timeGranularity: 'hour',
            })

            expect(result.valid).toBe(true)
            expect(result.errors.length).toBe(0)
        })
    })
})
