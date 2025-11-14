/**
 * SSE React Hooks
 */

import { useEffect, useState, useRef } from 'react'
import { createSSEConnection } from './client'

/**
 * 通用 SSE Hook
 *
 * @param endpoint - SSE 端点路径
 * @param enabled - 是否启用连接
 * @returns { data, isConnected, error }
 */
export function useSSE<T>(endpoint: string, enabled: boolean = true) {
    const [data, setData] = useState<T | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const cleanupRef = useRef<(() => void) | null>(null)

    useEffect(() => {
        if (!enabled) {
            // 如果禁用，清理现有连接
            if (cleanupRef.current) {
                cleanupRef.current()
                cleanupRef.current = null
            }
            setIsConnected(false)
            return
        }

        // 创建 SSE 连接
        const cleanup = createSSEConnection(endpoint, {
            onMessage: newData => {
                setData(newData as T)
                setError(null)
            },
            onError: err => {
                setError(err)
                setIsConnected(false)
            },
            onOpen: () => {
                setIsConnected(true)
                setError(null)
            },
            onClose: () => {
                setIsConnected(false)
            },
        })

        cleanupRef.current = cleanup

        // 清理函数
        return () => {
            cleanup()
            cleanupRef.current = null
        }
    }, [endpoint, enabled])

    return { data, isConnected, error }
}

/**
 * SSE 数据流 Hook（替换数据，不累积）
 *
 * 注意：后端 SSE 端点发送的是完整的数据列表，不是增量数据
 * 因此这里直接替换数据，而不是累积
 *
 * @param endpoint - SSE 端点路径
 * @param enabled - 是否启用连接
 * @param maxItems - 最大保留数据条数（用于限制后端返回的数据）
 * @returns { items, isConnected, error, clear }
 */
export function useSSEStream<T>(endpoint: string, enabled: boolean = true, maxItems: number = 100) {
    const [items, setItems] = useState<T[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const cleanupRef = useRef<(() => void) | null>(null)

    useEffect(() => {
        if (!enabled) {
            if (cleanupRef.current) {
                cleanupRef.current()
                cleanupRef.current = null
            }
            setIsConnected(false)
            return
        }

        const cleanup = createSSEConnection(endpoint, {
            onMessage: newData => {
                // 后端发送的是完整的数据对象，包含 data 数组
                // 例如: { data: [...], total: 10, page: 1 }
                if (newData && typeof newData === 'object' && 'data' in newData) {
                    const dataObj = newData as { data: unknown }
                    const dataArray = dataObj.data
                    if (Array.isArray(dataArray)) {
                        // 直接替换数据，限制最大条数
                        setItems(dataArray.slice(0, maxItems) as T[])
                    } else {
                        // 如果 data 不是数组，将整个对象作为单个元素
                        setItems([newData as T])
                    }
                } else if (Array.isArray(newData)) {
                    // 如果后端直接发送数组
                    setItems((newData as T[]).slice(0, maxItems))
                } else {
                    // 如果是单个对象，作为单个元素
                    setItems([newData as T])
                }
                setError(null)
            },
            onError: err => {
                setError(err)
                setIsConnected(false)
            },
            onOpen: () => {
                setIsConnected(true)
                setError(null)
            },
            onClose: () => {
                setIsConnected(false)
            },
        })

        cleanupRef.current = cleanup

        return () => {
            cleanup()
            cleanupRef.current = null
        }
    }, [endpoint, enabled, maxItems])

    const clear = () => setItems([])

    return { items, isConnected, error, clear }
}
