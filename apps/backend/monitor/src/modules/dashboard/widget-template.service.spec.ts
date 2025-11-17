import { NotFoundException } from '@nestjs/common'
import { describe, it, expect, beforeEach } from 'vitest'

import { WidgetTemplateService } from './widget-template.service'
import type { TemplateParams } from './widget-template.types'

describe('WidgetTemplateService', () => {
    let service: WidgetTemplateService

    beforeEach(() => {
        service = new WidgetTemplateService()
    })

    describe('getAllTemplates', () => {
        it('应该返回所有模板列表', () => {
            const result = service.getAllTemplates()

            expect(result).toHaveProperty('templates')
            expect(Array.isArray(result.templates)).toBe(true)
            expect(result.templates.length).toBeGreaterThan(0)
        })

        it('应该返回 5 个核心模板', () => {
            const result = service.getAllTemplates()

            expect(result.templates.length).toBe(5)
        })

        it('每个模板应该包含必要的元数据', () => {
            const result = service.getAllTemplates()

            result.templates.forEach(template => {
                expect(template).toHaveProperty('type')
                expect(template).toHaveProperty('name')
                expect(template).toHaveProperty('description')
                expect(template).toHaveProperty('category')
                expect(template).toHaveProperty('widgetType')
            })
        })

        it('不应该包含 generateQuery 函数', () => {
            const result = service.getAllTemplates()

            result.templates.forEach(template => {
                expect(template).not.toHaveProperty('generateQuery')
            })
        })
    })

    describe('getTemplateByType', () => {
        it('应该返回指定类型的模板', () => {
            const template = service.getTemplateByType('web_vitals_trend')

            expect(template.type).toBe('web_vitals_trend')
            expect(template.name).toBe('Web Vitals 性能趋势')
            expect(template.category).toBe('performance')
        })

        it('应该在模板不存在时抛出异常', () => {
            expect(() => service.getTemplateByType('invalid_template' as any)).toThrow(NotFoundException)
        })
    })

    describe('getTemplatesByCategory', () => {
        it('应该返回性能监控类模板', () => {
            const templates = service.getTemplatesByCategory('performance')

            expect(templates.length).toBeGreaterThan(0)
            templates.forEach(template => {
                expect(template.category).toBe('performance')
            })
        })

        it('应该返回错误监控类模板', () => {
            const templates = service.getTemplatesByCategory('error')

            expect(templates.length).toBeGreaterThan(0)
            templates.forEach(template => {
                expect(template.category).toBe('error')
            })
        })

        it('应该返回用户行为类模板', () => {
            const templates = service.getTemplatesByCategory('user')

            expect(templates.length).toBeGreaterThan(0)
            templates.forEach(template => {
                expect(template.category).toBe('user')
            })
        })
    })

    describe('generateQueryFromTemplate', () => {
        it('应该为 web_vitals_trend 生成 6 个查询', () => {
            const params: TemplateParams = {
                appId: 'test-app',
                timeGranularity: 'hour',
            }

            const queries = service.generateQueryFromTemplate('web_vitals_trend', params)

            expect(queries.length).toBe(6)
            expect(queries[0].id).toBe('lcp')
            expect(queries[1].id).toBe('fcp')
            expect(queries[2].id).toBe('fid')
            expect(queries[3].id).toBe('cls')
            expect(queries[4].id).toBe('ttfb')
            expect(queries[5].id).toBe('inp')
        })

        it('应该为 error_trend 生成 3 个查询', () => {
            const params: TemplateParams = {
                appId: 'test-app',
                timeGranularity: 'hour',
            }

            const queries = service.generateQueryFromTemplate('error_trend', params)

            expect(queries.length).toBe(3)
            expect(queries[0].id).toBe('error')
            expect(queries[1].id).toBe('unhandledrejection')
            expect(queries[2].id).toBe('httpError')
        })

        it('应该支持多个 appId', () => {
            const params: TemplateParams = {
                appId: ['app1', 'app2', 'app3'],
                timeGranularity: 'hour',
            }

            const queries = service.generateQueryFromTemplate('web_vitals_trend', params)

            expect(queries.length).toBe(6)
            queries.forEach(query => {
                expect(query.conditions.length).toBeGreaterThan(0)
            })
        })

        it('应该支持不同的时间粒度', () => {
            const paramsMinute: TemplateParams = {
                appId: 'test-app',
                timeGranularity: 'minute',
            }

            const queriesMinute = service.generateQueryFromTemplate('web_vitals_trend', paramsMinute)
            expect(queriesMinute[0].groupBy).toContain('toStartOfMinute(timestamp)')

            const paramsDay: TemplateParams = {
                appId: 'test-app',
                timeGranularity: 'day',
            }

            const queriesDay = service.generateQueryFromTemplate('web_vitals_trend', paramsDay)
            expect(queriesDay[0].groupBy).toContain('toStartOfDay(timestamp)')
        })

        it('应该支持 limit 参数', () => {
            const params: TemplateParams = {
                appId: 'test-app',
                limit: 20,
            }

            const queries = service.generateQueryFromTemplate('error_distribution', params)

            expect(queries[0].limit).toBe(20)
        })
    })

    describe('validateTemplateParams', () => {
        it('应该验证 appId 是否存在', () => {
            const params: TemplateParams = {
                appId: '',
            }

            const result = service.validateTemplateParams('web_vitals_trend', params)

            expect(result.valid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
        })

        it('应该验证空数组 appId', () => {
            const params: TemplateParams = {
                appId: [],
            }

            const result = service.validateTemplateParams('web_vitals_trend', params)

            expect(result.valid).toBe(false)
            expect(result.errors).toContain('appId is required')
        })

        it('应该验证 timeGranularity 是否有效', () => {
            const params: TemplateParams = {
                appId: 'test-app',
                timeGranularity: 'invalid' as any,
            }

            const result = service.validateTemplateParams('web_vitals_trend', params)

            expect(result.valid).toBe(false)
            expect(result.errors.some(err => err.includes('Invalid timeGranularity'))).toBe(true)
        })

        it('应该验证 limit 是否在范围内', () => {
            const paramsMin: TemplateParams = {
                appId: 'test-app',
                limit: 2,
            }

            const resultMin = service.validateTemplateParams('error_distribution', paramsMin)
            expect(resultMin.valid).toBe(false)

            const paramsMax: TemplateParams = {
                appId: 'test-app',
                limit: 100,
            }

            const resultMax = service.validateTemplateParams('error_distribution', paramsMax)
            expect(resultMax.valid).toBe(false)
        })

        it('应该接受有效的参数', () => {
            const params: TemplateParams = {
                appId: 'test-app',
                timeGranularity: 'hour',
            }

            const result = service.validateTemplateParams('web_vitals_trend', params)

            expect(result.valid).toBe(true)
            expect(result.errors.length).toBe(0)
        })

        it('应该接受有效的 limit', () => {
            const params: TemplateParams = {
                appId: 'test-app',
                limit: 10,
            }

            const result = service.validateTemplateParams('error_distribution', params)

            expect(result.valid).toBe(true)
            expect(result.errors.length).toBe(0)
        })
    })
})
