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
 * SSE 数据流 Hook（累积数据）
 *
 * @param endpoint - SSE 端点路径
 * @param enabled - 是否启用连接
 * @param maxItems - 最大保留数据条数
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
                setItems(prev => {
                    const updated = [newData as T, ...prev]
                    return updated.slice(0, maxItems)
                })
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
