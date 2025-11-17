import type { QueryConfig } from '../../entities/dashboard-widget.entity'

/**
 * Widget 模板类型枚举
 */
export type WidgetTemplateType =
    // 性能监控类
    | 'web_vitals_trend'
    | 'page_performance_table'
    | 'performance_distribution'
    | 'network_performance'
    | 'http_performance_table'
    // 错误监控类
    | 'error_trend'
    | 'error_distribution'
    | 'error_details_table'
    | 'http_error_analysis'
    // 用户行为类
    | 'active_users'
    | 'session_analysis'
    | 'top_pages'
    // 设备环境类
    | 'browser_distribution'
    | 'os_distribution'
    | 'device_type_distribution'

/**
 * 模板分类
 */
export type TemplateCategory = 'performance' | 'error' | 'user' | 'device'

/**
 * 时间粒度
 */
export type TimeGranularity = 'minute' | 'hour' | 'day'

/**
 * 模板参数
 */
export interface TemplateParams {
    appId?: string | string[]
    timeGranularity?: TimeGranularity
    limit?: number
}

/**
 * Widget 模板配置
 */
export interface WidgetTemplate {
    type: WidgetTemplateType
    name: string
    description: string
    category: TemplateCategory
    widgetType: 'line' | 'bar' | 'area' | 'table' | 'world_map' | 'big_number'
    icon?: string

    /**
     * 可编辑的参数配置
     */
    editableParams?: {
        timeGranularity?: {
            enabled: boolean
            default: TimeGranularity
            options: TimeGranularity[]
        }
        limit?: {
            enabled: boolean
            default: number
            min: number
            max: number
        }
    }

    /**
     * 生成查询配置
     */
    generateQuery: (params: TemplateParams) => QueryConfig[]
}

/**
 * 模板列表响应
 */
export interface TemplateListResponse {
    templates: WidgetTemplateMeta[]
}

/**
 * 模板元数据 (不包含 generateQuery 函数)
 */
export interface WidgetTemplateMeta {
    type: WidgetTemplateType
    name: string
    description: string
    category: TemplateCategory
    widgetType: 'line' | 'bar' | 'area' | 'table' | 'world_map' | 'big_number'
    icon?: string
    editableParams?: {
        timeGranularity?: {
            enabled: boolean
            default: TimeGranularity
            options: TimeGranularity[]
        }
        limit?: {
            enabled: boolean
            default: number
            min: number
            max: number
        }
    }
}
