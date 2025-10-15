/**
 * Transport interface
 * 定义传输接口，用于发送数据
 * 为了适配不同客户端，例如浏览器、Node.js 等
 */
export interface Transport {
    send(data: Record<string, unknown>): void
}
