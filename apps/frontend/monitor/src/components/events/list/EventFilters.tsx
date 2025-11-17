import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X } from 'lucide-react'
import { useState } from 'react'

export interface EventFiltersState {
    eventType: string
    timeRange: string
}

interface EventFiltersProps {
    filters: EventFiltersState
    onFiltersChange: (filters: EventFiltersState) => void
}

export function EventFilters({ filters, onFiltersChange }: EventFiltersProps) {
    const [localFilters, setLocalFilters] = useState(filters)

    const handleFilterChange = (key: keyof EventFiltersState, value: string) => {
        const newFilters = { ...localFilters, [key]: value }
        setLocalFilters(newFilters)
        onFiltersChange(newFilters)
    }

    const handleReset = () => {
        const resetFilters: EventFiltersState = {
            eventType: 'all',
            timeRange: '1h',
        }
        setLocalFilters(resetFilters)
        onFiltersChange(resetFilters)
    }

    const hasActiveFilters = localFilters.eventType !== 'all'

    return (
        <div className="space-y-4 rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">筛选条件</h3>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={handleReset}>
                        <X className="mr-1 h-4 w-4" />
                        清空
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="eventType">事件类型</Label>
                    <Select value={localFilters.eventType} onValueChange={value => handleFilterChange('eventType', value)}>
                        <SelectTrigger id="eventType">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全部</SelectItem>
                            <SelectItem value="error">error</SelectItem>
                            <SelectItem value="exception">exception</SelectItem>
                            <SelectItem value="unhandledrejection">unhandledrejection</SelectItem>
                            <SelectItem value="performance">performance</SelectItem>
                            <SelectItem value="webVital">webVital</SelectItem>
                            <SelectItem value="message">message</SelectItem>
                            <SelectItem value="session">session</SelectItem>
                            <SelectItem value="replay">replay</SelectItem>
                            <SelectItem value="transaction">transaction</SelectItem>
                            <SelectItem value="custom">custom</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="timeRange">时间范围</Label>
                    <Select value={localFilters.timeRange} onValueChange={value => handleFilterChange('timeRange', value)}>
                        <SelectTrigger id="timeRange">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="15m">最近 15 分钟</SelectItem>
                            <SelectItem value="1h">最近 1 小时</SelectItem>
                            <SelectItem value="6h">最近 6 小时</SelectItem>
                            <SelectItem value="24h">最近 24 小时</SelectItem>
                            <SelectItem value="7d">最近 7 天</SelectItem>
                            <SelectItem value="30d">最近 30 天</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )
}
