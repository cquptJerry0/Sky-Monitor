import { captureEvent, Integration } from '@sky-monitor/monitor-sdk-core'
import { collectDeviceInfo, collectNetworkInfo, generateErrorFingerprint } from '@sky-monitor/monitor-sdk-browser'

import { VueErrorEvent, VueIntegrationOptions, VueInstance } from './types'

/**
 * Vue 错误处理集成
 */
export class VueIntegration implements Integration {
    name = 'VueIntegration'
    priority = 40 // 优先级：在错误采集和采样之后执行
    private options: Required<VueIntegrationOptions>
    private deviceInfo?: ReturnType<typeof collectDeviceInfo>
    private networkInfo?: ReturnType<typeof collectNetworkInfo>

    constructor(options: VueIntegrationOptions) {
        if (!options.Vue) {
            throw new Error('VueIntegration requires a Vue instance')
        }

        this.options = {
            Vue: options.Vue,
            attachProps: options.attachProps !== false,
            logErrors: options.logErrors !== false,
            trackComponents: options.trackComponents !== false,
            maxComponentDepth: options.maxComponentDepth || 5,
        }
    }

    /**
     * 全局初始化
     */
    setupOnce(): void {
        // 收集设备和网络信息
        this.deviceInfo = collectDeviceInfo()
        this.networkInfo = collectNetworkInfo()

        // 设置 Vue 全局错误处理器
        const originalErrorHandler = this.options.Vue.config.errorHandler

        this.options.Vue.config.errorHandler = (err: Error, vm: VueInstance, info: string) => {
            this.handleVueError(err, vm, info)

            // 调用原有的错误处理器
            if (originalErrorHandler && typeof originalErrorHandler === 'function') {
                originalErrorHandler.call(this.options.Vue, err, vm, info)
            }

            // 在控制台打印错误
            if (this.options.logErrors) {
                console.error('[Sky Monitor Vue Error]', err)
            }
        }
    }

    /**
     * 处理 Vue 错误
     */
    private handleVueError(err: Error, vm: VueInstance, info: string): void {
        const componentName = this.getComponentName(vm)
        const componentHierarchy = this.options.trackComponents ? this.getComponentHierarchy(vm) : undefined
        const props = this.options.attachProps ? this.extractProps(vm) : undefined

        // 生成错误指纹
        const fingerprint = generateErrorFingerprint(err, err.message, 'vue')

        const event: VueErrorEvent = {
            type: 'error',
            framework: 'vue',
            message: `[Vue Error] ${err.message}`,
            stack: err.stack,
            path: window.location.pathname,
            timestamp: new Date().toISOString(),
            errorFingerprint: fingerprint,
            vueError: {
                componentName,
                componentHierarchy,
                lifecycle: info,
                props,
            },
            device: this.deviceInfo,
            network: this.networkInfo,
        }

        captureEvent(event)
    }

    /**
     * 获取组件名称
     */
    private getComponentName(vm: VueInstance): string | undefined {
        if (!vm) return undefined

        // Vue 3
        if (vm.$options && vm.$options.name) {
            return vm.$options.name
        }

        // Vue 3 composition API
        if (vm.$ && vm.$.type && vm.$.type.name) {
            return vm.$.type.name
        }

        // Vue 2
        if (vm._isVue && vm.$options) {
            return vm.$options._componentTag || vm.$options.name
        }

        return undefined
    }

    /**
     * 获取组件层级（父子关系）
     */
    private getComponentHierarchy(vm: VueInstance): string[] {
        const hierarchy: string[] = []
        let current: VueInstance | undefined = vm
        let depth = 0

        while (current && depth < this.options.maxComponentDepth) {
            const name = this.getComponentName(current)
            if (name) {
                hierarchy.unshift(name)
            }

            // Vue 2
            current = current.$parent

            // Vue 3
            if (!current && vm.$ && vm.$.parent) {
                current = vm.$.parent
            }

            depth++
        }

        return hierarchy
    }

    /**
     * 提取组件 props（脱敏处理）
     */
    private extractProps(vm: VueInstance): Record<string, unknown> | undefined {
        if (!vm) return undefined

        try {
            // Vue 2
            if (vm.$props) {
                return this.sanitizeProps(vm.$props)
            }

            // Vue 3
            if (vm.$ && vm.$.props) {
                return this.sanitizeProps(vm.$.props)
            }

            return undefined
        } catch (error) {
            return undefined
        }
    }

    /**
     * 脱敏 props（移除敏感信息）
     */
    private sanitizeProps(props: Record<string, unknown>): Record<string, unknown> {
        const sanitized: Record<string, unknown> = {}
        const sensitiveKeys = ['password', 'token', 'secret', 'apikey', 'authorization']

        for (const [key, value] of Object.entries(props)) {
            const lowerKey = key.toLowerCase()

            // 检查是否为敏感字段
            if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
                sanitized[key] = '[REDACTED]'
                continue
            }

            // 限制值的大小
            if (typeof value === 'string' && value.length > 100) {
                sanitized[key] = value.slice(0, 100) + '...'
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = '[Object]'
            } else {
                sanitized[key] = value
            }
        }

        return sanitized
    }
}
