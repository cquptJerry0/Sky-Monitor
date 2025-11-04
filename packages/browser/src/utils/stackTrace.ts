/**
 * 堆栈帧接口
 */
export interface StackFrame {
    functionName?: string
    fileName?: string
    lineNumber?: number
    columnNumber?: number
    source: string
}

/**
 * 解析堆栈字符串为结构化数据
 */
export function parseStackTrace(stack: string): StackFrame[] {
    if (!stack) return []

    const lines = stack.split('\n')
    const frames: StackFrame[] = []

    for (const line of lines) {
        const trimmed = line.trim()

        // Chrome/Edge 格式: "at functionName (file:line:col)"
        const chromeMatch = trimmed.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/)
        if (chromeMatch) {
            frames.push({
                functionName: chromeMatch[1],
                fileName: chromeMatch[2],
                lineNumber: parseInt(chromeMatch[3] as string, 10),
                columnNumber: parseInt(chromeMatch[4] as string, 10),
                source: trimmed,
            })
            continue
        }

        // Chrome/Edge 格式: "at file:line:col"
        const chromeSimpleMatch = trimmed.match(/at\s+(.+?):(\d+):(\d+)/)
        if (chromeSimpleMatch) {
            frames.push({
                fileName: chromeSimpleMatch[1],
                lineNumber: parseInt(chromeSimpleMatch[2] as string, 10),
                columnNumber: parseInt(chromeSimpleMatch[3] as string, 10),
                source: trimmed,
            })
            continue
        }

        // Firefox 格式: "functionName@file:line:col"
        const firefoxMatch = trimmed.match(/(.+?)@(.+?):(\d+):(\d+)/)
        if (firefoxMatch) {
            frames.push({
                functionName: firefoxMatch[1],
                fileName: firefoxMatch[2],
                lineNumber: parseInt(firefoxMatch[3] as string, 10),
                columnNumber: parseInt(firefoxMatch[4] as string, 10),
                source: trimmed,
            })
            continue
        }

        // 如果无法解析，保留原始行
        if (trimmed && !trimmed.startsWith('Error')) {
            frames.push({
                source: trimmed,
            })
        }
    }

    return frames
}

/**
 * 格式化堆栈为可读字符串
 */
export function formatStackTrace(frames: StackFrame[]): string {
    return frames
        .map(frame => {
            const func = frame.functionName || '<anonymous>'
            const file = frame.fileName || 'unknown'
            const line = frame.lineNumber || '?'
            const col = frame.columnNumber || '?'
            return `  at ${func} (${file}:${line}:${col})`
        })
        .join('\n')
}

/**
 * 提取堆栈的关键帧（用于展示或分析）
 */
export function getKeyFrames(stack: string, count: number = 5): StackFrame[] {
    const frames = parseStackTrace(stack)
    return frames.slice(0, count)
}

/**
 * 增强错误对象的堆栈信息
 */
export function enhanceStack(error: Error): string {
    if (!error.stack) {
        return `${error.name}: ${error.message}`
    }

    const frames = parseStackTrace(error.stack)
    if (frames.length === 0) {
        return error.stack
    }

    return `${error.name}: ${error.message}\n${formatStackTrace(frames)}`
}
