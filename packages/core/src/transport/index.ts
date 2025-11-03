/**
 * Transport interface
 * 定义传输接口，用于发送数据
 * 为了适配不同客户端，例如浏览器、Node.js 等
 */
export interface Transport {
    /**
     * 发送数据
     */
    send(data: Record<string, unknown>): void

    /**
     * 刷新缓冲区（可选）
     * 用于批量传输时立即发送所有缓存的事件
     */
    flush?(): void | Promise<void>
}
