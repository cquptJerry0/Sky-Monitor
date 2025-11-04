/**
 * Transport 回调配置
 */
export interface TransportCallbacks {
    /**
     * 发送成功回调
     */
    onSuccess?(): void

    /**
     * 发送失败回调
     */
    onError?(error: Error): void
}

/**
 * Transport interface
 * 定义传输接口，用于发送数据
 * 为了适配不同客户端，例如浏览器、Node.js 等
 */
export interface Transport {
    /**
     * 发送数据
     * 支持异步操作
     */
    send(data: Record<string, unknown>): void | Promise<void>

    /**
     * 刷新缓冲区（可选）
     * 用于批量传输时立即发送所有缓存的事件
     */
    flush?(): void | Promise<void>

    /**
     * 关闭传输并清理资源（可选）
     * 用于清理定时器、监听器等
     */
    close?(): void | Promise<void>
}

/**
 * BaseTransport 抽象类
 * 提供 Transport 接口的默认实现
 * 简化自定义 Transport 的创建
 */
export abstract class BaseTransport implements Transport {
    protected callbacks?: TransportCallbacks

    constructor(callbacks?: TransportCallbacks) {
        this.callbacks = callbacks
    }

    /**
     * 发送数据 - 子类必须实现
     */
    abstract send(data: Record<string, unknown>): void | Promise<void>

    /**
     * 刷新缓冲区 - 默认空实现
     */
    flush(): void | Promise<void> {
        // 默认不做任何事
    }

    /**
     * 关闭并清理资源 - 默认空实现
     */
    close(): void | Promise<void> {
        // 默认不做任何事
    }

    /**
     * 触发成功回调
     */
    protected triggerSuccess(): void {
        this.callbacks?.onSuccess?.()
    }

    /**
     * 触发错误回调
     */
    protected triggerError(error: Error): void {
        this.callbacks?.onError?.(error)
    }
}
