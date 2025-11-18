import { Settings, Bug, Zap, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
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
        errorSampleRate,
        performanceSampleRate,
        sessionReplaySampleRate,
        enableErrorMonitoring,
        enablePerformanceMonitoring,
        enableSessionReplay,
        setErrorSampleRate,
        setPerformanceSampleRate,
        setSessionReplaySampleRate,
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

        switch (type) {
            case 'custom-events':
                for (let i = 0; i < count; i++) {
                    captureEvent({
                        type: 'custom',
                        name: 'batch_test_event',
                        message: `批量测试自定义事件 #${i + 1}`,
                        extra: {
                            index: i,
                            timestamp: Date.now(),
                            testData: `测试数据 ${i}`,
                        },
                    })
                }
                break
            case 'messages':
                for (let i = 0; i < count; i++) {
                    captureMessage(`批量测试消息事件 #${i + 1}`)
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
                    <SheetDescription>调整监控 SDK 的配置和采样率</SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <label className="text-sm font-medium">错误监控</label>
                            <Switch checked={enableErrorMonitoring} onCheckedChange={setEnableErrorMonitoring} />
                        </div>
                        {enableErrorMonitoring && (
                            <div>
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">采样率</span>
                                    <span className="font-medium">{errorSampleRate}%</span>
                                </div>
                                <Slider
                                    value={[errorSampleRate]}
                                    onValueChange={([value]) => setErrorSampleRate(value)}
                                    max={100}
                                    step={10}
                                />
                            </div>
                        )}
                    </div>

                    <Separator />

                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <label className="text-sm font-medium">性能监控</label>
                            <Switch checked={enablePerformanceMonitoring} onCheckedChange={setEnablePerformanceMonitoring} />
                        </div>
                        {enablePerformanceMonitoring && (
                            <div>
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">采样率</span>
                                    <span className="font-medium">{performanceSampleRate}%</span>
                                </div>
                                <Slider
                                    value={[performanceSampleRate]}
                                    onValueChange={([value]) => setPerformanceSampleRate(value)}
                                    max={100}
                                    step={10}
                                />
                            </div>
                        )}
                    </div>

                    <Separator />

                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <label className="text-sm font-medium">Session Replay</label>
                            <Switch checked={enableSessionReplay} onCheckedChange={setEnableSessionReplay} />
                        </div>
                        {enableSessionReplay && (
                            <div>
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">采样率</span>
                                    <span className="font-medium">{sessionReplaySampleRate}%</span>
                                </div>
                                <Slider
                                    value={[sessionReplaySampleRate]}
                                    onValueChange={([value]) => setSessionReplaySampleRate(value)}
                                    max={100}
                                    step={10}
                                />
                            </div>
                        )}
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
                            <li>采样率控制数据上报的比例</li>
                            <li>100% 表示所有事件都会上报</li>
                            <li>50% 表示随机上报一半的事件</li>
                            <li>配置会保存在本地存储中</li>
                            <li>批量测试会发送100个事件测试批量上报</li>
                        </ul>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
