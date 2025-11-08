import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface TimeRangePickerProps {
    value?: DateRange
    onChange?: (range: DateRange | undefined) => void
    className?: string
}

const presetRanges = [
    { label: '最近 1 小时', value: '1h', getRange: () => ({ from: new Date(Date.now() - 3600000), to: new Date() }) },
    { label: '最近 24 小时', value: '24h', getRange: () => ({ from: new Date(Date.now() - 86400000), to: new Date() }) },
    { label: '最近 7 天', value: '7d', getRange: () => ({ from: new Date(Date.now() - 604800000), to: new Date() }) },
    { label: '最近 30 天', value: '30d', getRange: () => ({ from: new Date(Date.now() - 2592000000), to: new Date() }) },
]

export function TimeRangePicker({ value, onChange, className }: TimeRangePickerProps) {
    const [preset, setPreset] = useState<string>('24h')
    const [customRange, setCustomRange] = useState<DateRange | undefined>(value)

    const handlePresetChange = (presetValue: string) => {
        setPreset(presetValue)
        const range = presetRanges.find(p => p.value === presetValue)
        if (range && onChange) {
            const dateRange = range.getRange()
            setCustomRange(dateRange)
            onChange(dateRange)
        }
    }

    const handleCustomRangeChange = (range: DateRange | undefined) => {
        setCustomRange(range)
        setPreset('custom')
        if (onChange) {
            onChange(range)
        }
    }

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <Select value={preset} onValueChange={handlePresetChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="选择时间范围" />
                </SelectTrigger>
                <SelectContent>
                    {presetRanges.map(range => (
                        <SelectItem key={range.value} value={range.value}>
                            {range.label}
                        </SelectItem>
                    ))}
                    <SelectItem value="custom">自定义</SelectItem>
                </SelectContent>
            </Select>

            {preset === 'custom' && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn('w-[280px] justify-start text-left font-normal', !customRange && 'text-muted-foreground')}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customRange?.from ? (
                                customRange.to ? (
                                    <>
                                        {format(customRange.from, 'yyyy-MM-dd')} - {format(customRange.to, 'yyyy-MM-dd')}
                                    </>
                                ) : (
                                    format(customRange.from, 'yyyy-MM-dd')
                                )
                            ) : (
                                <span>选择日期范围</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="range" selected={customRange} onSelect={handleCustomRangeChange} numberOfMonths={2} />
                    </PopoverContent>
                </Popover>
            )}
        </div>
    )
}
