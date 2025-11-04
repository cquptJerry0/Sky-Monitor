import { captureEvent, Integration } from '@sky-monitor/monitor-sdk-core'
import { collectDeviceInfo, collectNetworkInfo, generateErrorFingerprint } from '@sky-monitor/monitor-sdk-browser'

import { VueErrorEvent, VueRouterIntegrationOptions, RouteLocation } from './types'

/**
 * Vue Router 错误处理集成
 */
export class VueRouterIntegration implements Integration {
    name = 'VueRouterIntegration'
    priority = 41 // 优先级：在 VueIntegration 之后执行
    private options: Required<VueRouterIntegrationOptions>
    private deviceInfo?: ReturnType<typeof collectDeviceInfo>
    private networkInfo?: ReturnType<typeof collectNetworkInfo>

    constructor(options: VueRouterIntegrationOptions) {
        if (!options.router) {
            throw new Error('VueRouterIntegration requires a router instance')
        }

        this.options = {
            router: options.router,
            logErrors: options.logErrors !== false,
        }
    }

    /**
     * 全局初始化
     */
    setupOnce(): void {
        // 收集设备和网络信息
        this.deviceInfo = collectDeviceInfo()
        this.networkInfo = collectNetworkInfo()

        // 监听路由错误
        if (this.options.router.onError) {
            this.options.router.onError((error: Error) => {
                this.handleRouterError(error)
            })
        }

        // 监听路由导航守卫错误
        if (this.options.router.beforeEach) {
            this.options.router.beforeEach((to: RouteLocation, from: RouteLocation, next: () => void) => {
                try {
                    next()
                } catch (error) {
                    this.handleNavigationError(error as Error, to, from)
                    throw error
                }
            })
        }
    }

    /**
     * 处理路由错误
     */
    private handleRouterError(error: Error): void {
        // 生成错误指纹
        const fingerprint = generateErrorFingerprint(error, error.message, 'vue-router')

        const event: VueErrorEvent = {
            type: 'error',
            framework: 'vue',
            message: `[Vue Router Error] ${error.message}`,
            stack: error.stack,
            path: window.location.pathname,
            timestamp: new Date().toISOString(),
            errorFingerprint: fingerprint,
            vueError: {
                lifecycle: 'router',
            },
            device: this.deviceInfo,
            network: this.networkInfo,
        }

        captureEvent(event)

        // 在控制台打印错误
        if (this.options.logErrors) {
            console.error('[Sky Monitor Vue Router Error]', error)
        }
    }

    /**
     * 处理导航错误
     */
    private handleNavigationError(error: Error, to: RouteLocation, from: RouteLocation): void {
        // 生成错误指纹
        const fingerprint = generateErrorFingerprint(error, error.message, 'vue-router-navigation')

        const event: VueErrorEvent = {
            type: 'error',
            framework: 'vue',
            message: `[Vue Router Navigation Error] ${error.message}`,
            stack: error.stack,
            path: window.location.pathname,
            timestamp: new Date().toISOString(),
            errorFingerprint: fingerprint,
            vueError: {
                lifecycle: 'router-navigation',
                propsData: {
                    to: to.path || to.name,
                    from: from.path || from.name,
                },
            },
            device: this.deviceInfo,
            network: this.networkInfo,
        }

        captureEvent(event)

        // 在控制台打印错误
        if (this.options.logErrors) {
            console.error('[Sky Monitor Vue Router Navigation Error]', error, { to, from })
        }
    }
}
