import { ErrorFingerprint } from '../types/errorTypes'

/**
 * 简单的 FNV-1a 哈希算法实现
 */
function fnv1aHash(str: string): string {
    let hash = 2166136261 // FNV offset basis

    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i)
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
    }

    return (hash >>> 0).toString(36) // 转为36进制字符串
}

/**
 * 解析堆栈并提取关键帧
 */
function parseStackTrace(stack: string): string[] {
    if (!stack) return []

    const lines = stack.split('\n')
    const frames: string[] = []

    for (const line of lines) {
        // 跳过错误消息行
        if (line.trim().startsWith('at ') || line.includes('@')) {
            // 提取函数名和文件路径
            const cleanedLine = line
                .replace(/:\d+:\d+/g, '') // 移除行号和列号
                .replace(/\?.*$/g, '') // 移除查询参数
                .replace(/https?:\/\/[^/]+/g, '') // 移除域名，保留路径
                .replace(/\/[a-f0-9]{8,}\//g, '/') // 移除哈希路径
                .trim()

            frames.push(cleanedLine)
        }

        // 最多取前5帧
        if (frames.length >= 5) break
    }

    return frames
}

/**
 * 基于堆栈生成错误指纹
 */
export function generateErrorFingerprint(error: Error | string, message?: string, type?: string): ErrorFingerprint {
    let stack = ''
    let msg = message || ''

    if (typeof error === 'string') {
        msg = error
    } else if (error instanceof Error) {
        stack = error.stack || ''
        msg = msg || error.message
    }

    // 如果有堆栈，基于堆栈生成指纹
    if (stack) {
        const frames = parseStackTrace(stack)
        if (frames.length > 0) {
            const stackSignature = frames.join('|')
            const hash = fnv1aHash(`${type || 'error'}:${stackSignature}`)
            return {
                hash,
                algorithm: 'stacktrace',
            }
        }
    }

    // 如果没有堆栈，基于消息生成指纹
    const messageSignature = msg
        .replace(/\d+/g, 'N') // 将数字替换为 N
        .replace(/['"]/g, '') // 移除引号
        .replace(/\s+/g, ' ') // 合并空格
        .trim()

    const hash = fnv1aHash(`${type || 'error'}:${messageSignature}`)
    return {
        hash,
        algorithm: 'message',
    }
}

/**
 * 错误去重管理器
 */
class ErrorDeduplicator {
    private recentErrors = new Map<string, number>()
    private readonly timeWindow = 60000 // 1分钟

    /**
     * 检查是否应该报告该错误
     * @param fingerprint 错误指纹
     * @returns 是否应该报告
     */
    shouldReport(fingerprint: string): boolean {
        const now = Date.now()
        const lastReportTime = this.recentErrors.get(fingerprint)

        if (lastReportTime && now - lastReportTime < this.timeWindow) {
            return false // 1分钟内已报告过，跳过
        }

        this.recentErrors.set(fingerprint, now)

        // 清理过期记录
        this.cleanup(now)

        return true
    }

    /**
     * 清理过期的错误记录
     */
    private cleanup(now: number): void {
        for (const [key, time] of this.recentErrors.entries()) {
            if (now - time > this.timeWindow) {
                this.recentErrors.delete(key)
            }
        }
    }
}

// 全局去重器实例
export const errorDeduplicator = new ErrorDeduplicator()
