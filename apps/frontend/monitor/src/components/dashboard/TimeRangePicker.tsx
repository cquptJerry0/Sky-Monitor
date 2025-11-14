import { Clock } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
    const { timeRangePreset, setTimeRangePreset } = useDashboardStore()
    const [open, setOpen] = useState(false)

    const handlePresetClick = (preset: TimeRangePreset) => {
        setTimeRangePreset(preset)
        setOpen(false)
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
                <div className="p-2">
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
                </div>
            </PopoverContent>
        </Popover>
    )
}
