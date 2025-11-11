import { useEffect, useState } from 'react'
import { sseService } from '@/services/sse.service'

interface RealtimeError {
    timestamp: string
    message: string
    level: string
    fingerprint?: string
}

interface RealtimeStats {
    eventTrend?: number
    errorTrend?: number
    activeUsers?: number
}

export function useRealtimeData(appId: string | null) {
    const [realtimeErrors, setRealtimeErrors] = useState<RealtimeError[]>([])
    const [realtimeStats, setRealtimeStats] = useState<RealtimeStats | null>(null)
    const [isConnected, setIsConnected] = useState(false)

    useEffect(() => {
        if (!appId) {
            setRealtimeErrors([])
            setRealtimeStats(null)
            setIsConnected(false)
            return
        }

        // 订阅 SSE 事件
        sseService.subscribeToAppEvents(appId, {
            onStats: data => {
                setRealtimeStats(data)
                setIsConnected(true)
            },
            onError: data => {
                setRealtimeErrors(prev => {
                    // 保留最新的 10 条错误
                    const newErrors = [
                        {
                            timestamp: data.timestamp || new Date().toISOString(),
                            message: data.message || data.error || '未知错误',
                            level: data.level || 'error',
                            fingerprint: data.fingerprint,
                        },
                        ...prev,
                    ].slice(0, 10)
                    return newErrors
                })
                setIsConnected(true)
            },
            onSpike: data => {
                // 错误突增告警
                if (data.isSpike) {
                    console.warn('检测到错误突增:', data)
                    // 这里可以添加用户通知逻辑
                }
            },
        })

        // 清理函数
        return () => {
            sseService.unsubscribeApp(appId)
            setIsConnected(false)
        }
    }, [appId])

    return {
        realtimeErrors,
        realtimeStats,
        isConnected,
        clearErrors: () => setRealtimeErrors([]),
    }
}
