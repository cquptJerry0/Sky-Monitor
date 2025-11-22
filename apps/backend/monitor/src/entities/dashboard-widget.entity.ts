import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

import { DashboardEntity } from './dashboard.entity'

/**
 * Widget 可视化类型
 */
export type WidgetType = 'line' | 'bar' | 'area' | 'pie' | 'table' | 'world_map' | 'big_number' | 'radar'

/**
 * 查询条件
 */
export interface QueryCondition {
    field: string // 字段名,如 'event_type', 'browser_name'
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'IN' | 'NOT IN' | 'LIKE'
    value: string | number | string[] | number[]
}

/**
 * 排序配置
 */
export interface OrderByConfig {
    field: string // 字段名或聚合函数,如 'timestamp', 'count()'
    direction: 'ASC' | 'DESC'
}

/**
 * 单个查询配置
 */
export interface QueryConfig {
    id: string // 查询 ID,用于多查询对比
    rawSql?: string // 原始SQL (如果提供,则优先使用,忽略其他字段)
    fields: string[] // 查询字段,如 ['count()', 'quantile(0.95)(duration)']
    conditions: QueryCondition[] // 过滤条件
    groupBy?: string[] // 分组字段,如 ['toStartOfHour(timestamp)', 'browser_name']
    orderBy?: OrderByConfig[] // 排序
    limit?: number // 限制条数
    legend?: string // 图例名称
    color?: string // 图例颜色
}

/**
 * Y 轴配置
 */
export interface YAxisConfig {
    unit?: string // 单位,如 'ms', '%', 'count'
    min?: number | 'auto'
    max?: number | 'auto'
    scale?: 'linear' | 'log'
}

/**
 * Widget 显示配置
 */
export interface DisplayConfig {
    yAxis?: YAxisConfig
    showLegend?: boolean
    showGrid?: boolean
    stacked?: boolean // 是否堆叠 (用于 Area Chart)
}

/**
 * Widget 布局配置
 */
export interface LayoutConfig {
    x: number // 起始列 (0-11)
    y: number // 起始行
    w: number // 宽度 (占几列)
    h: number // 高度 (占几行)
}

/**
 * Dashboard Widget 实体
 * 用于存储 Dashboard 中的每个 Widget 配置
 */
@Entity('dashboard_widget')
export class DashboardWidgetEntity {
    constructor(partial: Partial<DashboardWidgetEntity>) {
        Object.assign(this, partial)
    }

    @PrimaryGeneratedColumn('uuid')
    id: string

    /**
     * 所属 Dashboard ID (外键)
     */
    @Column({ type: 'uuid' })
    dashboardId: string

    /**
     * Widget 标题
     */
    @Column({ type: 'varchar', length: 255 })
    title: string

    /**
     * Widget 类型
     */
    @Column({ type: 'varchar', length: 50 })
    widgetType: WidgetType

    /**
     * 查询配置 (JSON)
     * 支持多个查询,用于对比
     */
    @Column({ type: 'jsonb' })
    queries: QueryConfig[]

    /**
     * 显示配置 (JSON)
     */
    @Column({ type: 'jsonb', nullable: true })
    displayConfig: DisplayConfig

    /**
     * 布局配置 (JSON)
     */
    @Column({ type: 'jsonb' })
    layout: LayoutConfig

    /**
     * 创建时间
     */
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date

    /**
     * 更新时间
     */
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date

    /**
     * 关联的 Dashboard
     */
    @ManyToOne(() => DashboardEntity, dashboard => dashboard.widgets, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'dashboardId' })
    dashboard: DashboardEntity
}
