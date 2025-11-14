import { Calendar, Clock } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { type TimeRangePreset, useDashboardStore } from '@/stores/dashboard.store'

/**
 * 时间范围预设选项
 */
const TIME_RANGE_PRESETS: Array<{ value: TimeRangePreset; label: string }> = [
    { value: 'last_15m', label: '最近 15 分钟' },
    { value: 'last_1h', label: '最近 1 小时' },
    { value: 'last_6h', label: '最近 6 小时' },
    { value: 'last_24h', label: '最近 24 小时' },
    { value: 'last_7d', label: '最近 7 天' },
    { value: 'last_30d', label: '最近 30 天' },
]

/**
 * 格式化时间范围显示
 */
function formatTimeRange(preset: TimeRangePreset): string {
    const presetOption = TIME_RANGE_PRESETS.find(p => p.value === preset)
    if (presetOption) {
        return presetOption.label
    }
    return '自定义时间'
}

/**
 * 时间范围选择器组件
 */
export function TimeRangePicker() {
    const { timeRange, timeRangePreset, setTimeRange, setTimeRangePreset } = useDashboardStore()
    const [open, setOpen] = useState(false)
    const [customStart, setCustomStart] = useState<Date | undefined>(timeRange.start)
    const [customEnd, setCustomEnd] = useState<Date | undefined>(timeRange.end)

    const handlePresetClick = (preset: TimeRangePreset) => {
        setTimeRangePreset(preset)
        setOpen(false)
    }

    const handleCustomApply = () => {
        if (customStart && customEnd) {
            setTimeRange({ start: customStart, end: customEnd }, 'custom')
            setOpen(false)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-[240px] justify-start text-left font-normal')}>
                    <Clock className="mr-2 h-4 w-4" />
                    {formatTimeRange(timeRangePreset)}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Tabs defaultValue="preset" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="preset">快捷选项</TabsTrigger>
                        <TabsTrigger value="custom">自定义</TabsTrigger>
                    </TabsList>

                    <TabsContent value="preset" className="p-2">
                        <div className="flex flex-col gap-1">
                            {TIME_RANGE_PRESETS.map(preset => (
                                <Button
                                    key={preset.value}
                                    variant={timeRangePreset === preset.value ? 'default' : 'ghost'}
                                    className="justify-start"
                                    onClick={() => handlePresetClick(preset.value)}
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="custom" className="p-4">
                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium">开始时间</label>
                                <CalendarComponent mode="single" selected={customStart} onSelect={setCustomStart} initialFocus />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">结束时间</label>
                                <CalendarComponent mode="single" selected={customEnd} onSelect={setCustomEnd} initialFocus />
                            </div>
                            <Button className="w-full" onClick={handleCustomApply} disabled={!customStart || !customEnd}>
                                <Calendar className="mr-2 h-4 w-4" />
                                应用
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </PopoverContent>
        </Popover>
    )
}
