import { Settings, Bug, Zap, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useSdkConfigStore } from '@/store/sdk-config'
import { toast } from '@/hooks/use-toast'
import {
    simulateJavaScriptError,
    simulatePromiseRejection,
    simulateTypeError,
    simulateNetworkError,
    simulateCustomError,
} from '@/utils/errorSimulator'
import { simulateLongTask, simulateSlowAPI, measurePerformance } from '@/utils/performanceSimulator'
import { captureEvent, captureMessage } from '@/sdk'

export function SdkDebugPanel() {
    const {
        enableErrorMonitoring,
        enablePerformanceMonitoring,
        enableSessionReplay,
        setEnableErrorMonitoring,
        setEnablePerformanceMonitoring,
        setEnableSessionReplay,
    } = useSdkConfigStore()

    const handleTriggerError = (type: string) => {
        switch (type) {
            case 'js':
                simulateJavaScriptError()
                break
            case 'promise':
                simulatePromiseRejection()
                toast({ title: '已触发 Promise 拒绝' })
                break
            case 'type':
                simulateTypeError()
                break
            case 'network':
                simulateNetworkError()
                toast({ title: '已触发网络错误' })
                break
            case 'custom':
                simulateCustomError()
                break
        }
    }

    const handlePerformanceTest = async (type: string) => {
        switch (type) {
            case 'long-task':
                measurePerformance(() => simulateLongTask(), '长任务')
                toast({ title: '长任务已执行' })
                break
            case 'slow-api':
                toast({ title: '开始慢速 API 调用...' })
                await simulateSlowAPI(3000)
                toast({ title: '慢速 API 调用完成' })
                break
        }
    }

    const handleBatchTest = (type: string) => {
        const count = 100
        const startTime = performance.now()
        const batchId = Date.now() // 批次ID,用于区分不同批次

        switch (type) {
            case 'custom-events':
                for (let i = 0; i < count; i++) {
                    captureEvent({
                        type: 'custom',
                        name: `batch_test_event_${batchId}_${i}`, // 唯一名称避免去重
                        message: `批量测试自定义事件 #${i + 1}`,
                        extra: {
                            batchId, // 批次ID
                            index: i,
                            timestamp: Date.now(),
                            testData: `测试数据 ${i}`,
                        },
                    })
                }
                break
            case 'messages':
                for (let i = 0; i < count; i++) {
                    captureMessage(`批量测试消息事件 [批次${batchId}] #${i + 1}`) // 唯一消息避免去重
                }
                break
        }

        const duration = performance.now() - startTime
        toast({
            title: '批量事件已发送',
            description: `发送了 ${count} 个事件,耗时 ${duration.toFixed(2)}ms`,
        })
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>SDK 调试面板</SheetTitle>
                    <SheetDescription>调整监控 SDK 的配置和测试功能</SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    <div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">错误监控</label>
                            <Switch checked={enableErrorMonitoring} onCheckedChange={setEnableErrorMonitoring} />
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">性能监控</label>
                            <Switch checked={enablePerformanceMonitoring} onCheckedChange={setEnablePerformanceMonitoring} />
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Session Replay</label>
                            <Switch checked={enableSessionReplay} onCheckedChange={setEnableSessionReplay} />
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <h3 className="mb-3 text-sm font-medium">错误模拟</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleTriggerError('js')}>
                                <Bug className="mr-1 h-3 w-3" />
                                JS 错误
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleTriggerError('promise')}>
                                <Bug className="mr-1 h-3 w-3" />
                                Promise
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleTriggerError('type')}>
                                <Bug className="mr-1 h-3 w-3" />
                                类型错误
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleTriggerError('network')}>
                                <Bug className="mr-1 h-3 w-3" />
                                网络错误
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <h3 className="mb-3 text-sm font-medium">性能测试</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" onClick={() => handlePerformanceTest('long-task')}>
                                <Zap className="mr-1 h-3 w-3" />
                                长任务
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handlePerformanceTest('slow-api')}>
                                <Zap className="mr-1 h-3 w-3" />
                                慢速 API
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <h3 className="mb-3 text-sm font-medium">批量测试</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleBatchTest('custom-events')}>
                                <Send className="mr-1 h-3 w-3" />
                                100个自定义事件
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleBatchTest('messages')}>
                                <Send className="mr-1 h-3 w-3" />
                                100个消息事件
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    <div className="rounded-lg bg-muted p-4 text-sm">
                        <p className="mb-2 font-medium">说明</p>
                        <ul className="space-y-1 text-muted-foreground">
                            <li>开关控制对应功能的启用/禁用</li>
                            <li>错误模拟用于测试错误捕获功能</li>
                            <li>性能测试用于测试性能监控功能</li>
                            <li>批量测试会发送100个唯一事件</li>
                        </ul>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
