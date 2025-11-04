import { MonitoringEvent } from './types'

/**
 * 中间件函数类型
 */
export type Middleware = (event: MonitoringEvent) => MonitoringEvent | null | Promise<MonitoringEvent | null>

/**
 * 事件处理管道
 * 基于中间件模式实现
 */
export class EventPipeline {
    private middlewares: Middleware[] = []

    /**
     * 添加中间件到管道
     */
    use(middleware: Middleware): this {
        this.middlewares.push(middleware)
        return this
    }

    /**
     * 执行管道中的所有中间件
     * 如果任意中间件返回null，则中断执行
     */
    async execute(event: MonitoringEvent): Promise<MonitoringEvent | null> {
        let result: MonitoringEvent | null = event

        for (const middleware of this.middlewares) {
            if (result === null) return null
            result = await middleware(result)
        }

        return result
    }
}
