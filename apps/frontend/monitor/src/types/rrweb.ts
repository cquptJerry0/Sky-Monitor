/**
 * RRWeb 类型定义
 *
 * rrweb 是一个开源的会话录制库,用于记录和回放用户在网页上的操作
 * 这里定义了 rrweb 相关的 TypeScript 类型
 */

/**
 * RRWeb 事件类型枚举
 */
export enum EventType {
    DomContentLoaded = 0,
    Load = 1,
    FullSnapshot = 2,
    IncrementalSnapshot = 3,
    Meta = 4,
    Custom = 5,
    Plugin = 6,
}

/**
 * RRWeb 事件基础接口
 * 所有 rrweb 事件都包含这些字段
 */
export interface EventWithTime {
    type: EventType
    timestamp: number
    data: unknown
}

/**
 * RRWeb 播放器实例接口
 */
export interface RRWebPlayerInstance {
    play: () => void
    pause: () => void
    goto: (timestamp: number) => void
    setSpeed: (speed: number) => void
    on: (event: string, handler: (payload: unknown) => void) => void
    off: (event: string, handler: (payload: unknown) => void) => void
    destroy?: () => void
}

/**
 * RRWeb 播放器配置
 */
export interface RRWebPlayerConfig {
    target: HTMLElement
    props: {
        events: EventWithTime[]
        width?: number
        height?: number
        autoPlay?: boolean
        showController?: boolean
        speedOption?: number[]
        skipInactive?: boolean
        showWarning?: boolean
    }
}

/**
 * RRWeb 播放器事件 Payload
 */
export interface PlayerEventPayload {
    currentTime?: number
    state?: 'playing' | 'paused' | 'stopped'
}

/**
 * Recharts 数据点类型
 * Recharts 图表库使用的数据格式
 */
export interface ChartDataPoint {
    name: string
    [key: string]: string | number | undefined
}

/**
 * Recharts 自定义 Payload 类型
 * 用于 Tooltip 等组件的回调参数
 */
export interface ChartPayload {
    name?: string
    value?: number
    dataKey?: string
    color?: string
    payload?: ChartDataPoint
    /** 其他动态属性 */
    [key: string]: unknown
}
