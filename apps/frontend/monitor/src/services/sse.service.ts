import { queryClient } from '@/utils/query-client'

interface EventHandlers {
    onError?: (data: any) => void
    onPerformance?: (data: any) => void
    onStats?: (data: any) => void
    onWebVitals?: (data: any) => void
    onSpike?: (data: any) => void
}

export class SSEService {
    private static instance: SSEService | null = null
    private eventSources = new Map<string, EventSource>()
    private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'

    static getInstance(): SSEService {
        if (!SSEService.instance) {
            SSEService.instance = new SSEService()
        }
        return SSEService.instance
    }

    private constructor() {}

    subscribeToAppEvents(appId: string, handlers: EventHandlers) {
        // 先清理旧的订阅
        this.unsubscribeApp(appId)

        // 订阅错误流
        if (handlers.onError) {
            const errorSource = new EventSource(`${this.baseUrl}/api/events/stream/errors?appId=${appId}`)
            errorSource.onmessage = event => {
                try {
                    const data = JSON.parse(event.data)
                    handlers.onError?.(data)
                    // 更新缓存
                    queryClient.invalidateQueries({ queryKey: ['errors', appId] })
                } catch (error) {
                    console.error('Failed to parse error event:', error)
                }
            }
            errorSource.onerror = error => {
                console.error('Error stream failed:', error)
                errorSource.close()
            }
            this.eventSources.set(`errors-${appId}`, errorSource)
        }

        // 订阅性能流
        if (handlers.onPerformance) {
            const perfSource = new EventSource(`${this.baseUrl}/api/events/stream/performance?appId=${appId}`)
            perfSource.onmessage = event => {
                try {
                    const data = JSON.parse(event.data)
                    handlers.onPerformance?.(data)
                    queryClient.invalidateQueries({ queryKey: ['performance', appId] })
                } catch (error) {
                    console.error('Failed to parse performance event:', error)
                }
            }
            perfSource.onerror = error => {
                console.error('Performance stream failed:', error)
                perfSource.close()
            }
            this.eventSources.set(`perf-${appId}`, perfSource)
        }

        // 订阅统计流
        if (handlers.onStats) {
            const statsSource = new EventSource(`${this.baseUrl}/api/events/stream/stats?appId=${appId}`)
            statsSource.onmessage = event => {
                try {
                    const data = JSON.parse(event.data)
                    handlers.onStats?.(data)
                    queryClient.invalidateQueries({ queryKey: ['stats', appId] })
                } catch (error) {
                    console.error('Failed to parse stats event:', error)
                }
            }
            statsSource.onerror = error => {
                console.error('Stats stream failed:', error)
                statsSource.close()
            }
            this.eventSources.set(`stats-${appId}`, statsSource)
        }

        // 订阅Web Vitals流
        if (handlers.onWebVitals) {
            const vitalsSource = new EventSource(`${this.baseUrl}/api/events/stream/web-vitals?appId=${appId}`)
            vitalsSource.onmessage = event => {
                try {
                    const data = JSON.parse(event.data)
                    handlers.onWebVitals?.(data)
                    queryClient.invalidateQueries({ queryKey: ['webVitals', appId] })
                } catch (error) {
                    console.error('Failed to parse web vitals event:', error)
                }
            }
            vitalsSource.onerror = error => {
                console.error('Web vitals stream failed:', error)
                vitalsSource.close()
            }
            this.eventSources.set(`vitals-${appId}`, vitalsSource)
        }

        // 订阅错误突增告警
        if (handlers.onSpike) {
            const spikeSource = new EventSource(`${this.baseUrl}/api/error-analytics/stream/spikes?appId=${appId}`)
            spikeSource.onmessage = event => {
                try {
                    const data = JSON.parse(event.data)
                    handlers.onSpike?.(data)
                    // 可以触发告警通知
                    if (data.isSpike) {
                        console.warn('Error spike detected:', data)
                    }
                } catch (error) {
                    console.error('Failed to parse spike event:', error)
                }
            }
            spikeSource.onerror = error => {
                console.error('Spike stream failed:', error)
                spikeSource.close()
            }
            this.eventSources.set(`spike-${appId}`, spikeSource)
        }
    }

    unsubscribeApp(appId: string) {
        // 关闭特定应用的所有流
        const keysToDelete: string[] = []
        this.eventSources.forEach((source, key) => {
            if (key.includes(appId)) {
                source.close()
                keysToDelete.push(key)
            }
        })
        keysToDelete.forEach(key => this.eventSources.delete(key))
    }

    unsubscribeAll() {
        this.eventSources.forEach(source => source.close())
        this.eventSources.clear()
    }

    isConnected(streamType: string, appId: string): boolean {
        const source = this.eventSources.get(`${streamType}-${appId}`)
        return source?.readyState === EventSource.OPEN
    }

    getActiveStreams(): string[] {
        return Array.from(this.eventSources.keys())
    }
}

// 导出单例
export const sseService = SSEService.getInstance()
