import type { ErrorEvent } from '@sky-monitor/monitor-sdk-core'
import type { DeviceInfo, NetworkInfo, ErrorFingerprint } from '@sky-monitor/monitor-sdk-browser'

/**
 * Vue 实例类型（兼容 Vue 2 和 Vue 3）
 */
export interface VueInstance {
    $options?: {
        name?: string
        _componentTag?: string
    }
    $parent?: VueInstance
    $props?: Record<string, unknown>
    $?: {
        type?: { name?: string }
        parent?: VueInstance
        props?: Record<string, unknown>
    }
    _isVue?: boolean
}

/**
 * Vue Router 路由对象
 */
export interface RouteLocation {
    path?: string
    name?: string
    params?: Record<string, string | string[]>
    query?: Record<string, string | string[]>
}

/**
 * Vue Router 实例类型
 */
export interface VueRouter {
    onError?: (callback: (error: Error) => void) => void
    beforeEach?: (guard: (to: RouteLocation, from: RouteLocation, next: () => void) => void) => void
}

/**
 * Vue 构造函数类型
 */
export interface VueConstructor {
    config: {
        errorHandler?: (err: Error, vm: VueInstance, info: string) => void
    }
}

/**
 * Vue 错误详情
 */
export interface VueErrorDetails {
    componentName?: string
    componentHierarchy?: string[]
    lifecycle?: string
    props?: Record<string, unknown>
    propsData?: Record<string, unknown>
}

/**
 * Vue 错误事件
 */
export interface VueErrorEvent extends ErrorEvent {
    framework: 'vue'
    path?: string
    vueError?: VueErrorDetails
    device?: DeviceInfo
    network?: NetworkInfo
    errorFingerprint?: ErrorFingerprint
}

/**
 * Vue 集成配置
 */
export interface VueIntegrationOptions {
    Vue: VueConstructor
    attachProps?: boolean
    logErrors?: boolean
    trackComponents?: boolean
    maxComponentDepth?: number
}

/**
 * Vue Router 集成配置
 */
export interface VueRouterIntegrationOptions {
    router: VueRouter
    logErrors?: boolean
}
