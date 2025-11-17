import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useSdkConfigStore } from '@/store/sdk-config'

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

                    <div className="rounded-lg bg-muted p-4 text-sm">
                        <p className="mb-2 font-medium">说明</p>
                        <ul className="space-y-1 text-muted-foreground">
                            <li>采样率控制数据上报的比例</li>
                            <li>100% 表示所有事件都会上报</li>
                            <li>50% 表示随机上报一半的事件</li>
                            <li>配置会保存在本地存储中</li>
                        </ul>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
