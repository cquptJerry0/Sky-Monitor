import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface EventTypeOption {
    value: string
    label: string
    children?: EventTypeOption[]
}

const eventTypeOptions: EventTypeOption[] = [
    { value: 'all', label: '全部事件' },
    {
        value: 'error',
        label: '错误事件',
        children: [
            { value: 'error', label: '全部错误' },
            { value: 'runtime_error', label: 'JS运行时错误' },
            { value: 'http_error', label: 'HTTP请求错误' },
            { value: 'resource_error', label: '资源加载错误' },
            { value: 'unhandled_rejection', label: 'Promise拒绝' },
        ],
    },
    {
        value: 'performance',
        label: '性能事件',
        children: [
            { value: 'performance', label: '全部性能' },
            { value: 'http_performance', label: 'HTTP性能' },
            { value: 'resource_timing', label: '资源性能' },
        ],
    },
    {
        value: 'webVital',
        label: 'Web Vitals',
        children: [
            { value: 'webVital', label: '全部指标' },
            { value: 'LCP', label: 'LCP (最大内容绘制)' },
            { value: 'FCP', label: 'FCP (首次内容绘制)' },
            { value: 'CLS', label: 'CLS (累积布局偏移)' },
            { value: 'TTFB', label: 'TTFB (首字节时间)' },
            { value: 'FID', label: 'FID (首次输入延迟)' },
            { value: 'INP', label: 'INP (交互到下一次绘制)' },
        ],
    },
    { value: 'session', label: '会话统计' },
    { value: 'message', label: '日志消息' },
    { value: 'custom', label: '自定义事件' },
]

interface EventTypeTreeSelectProps {
    value: string
    onChange: (value: string) => void
}

export function EventTypeTreeSelect({ value, onChange }: EventTypeTreeSelectProps) {
    const [open, setOpen] = useState(false)
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['error']))

    const toggleGroup = (groupValue: string) => {
        const newExpanded = new Set(expandedGroups)
        if (newExpanded.has(groupValue)) {
            newExpanded.delete(groupValue)
        } else {
            newExpanded.add(groupValue)
        }
        setExpandedGroups(newExpanded)
    }

    const handleSelect = (optionValue: string) => {
        onChange(optionValue)
        setOpen(false)
    }

    const getDisplayLabel = () => {
        for (const option of eventTypeOptions) {
            if (option.value === value) {
                return option.label
            }
            if (option.children) {
                const child = option.children.find(c => c.value === value)
                if (child) {
                    return child.label
                }
            }
        }
        return '选择事件类型'
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                    {getDisplayLabel()}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto min-w-[240px] p-0" align="start">
                <div className="p-1">
                    {eventTypeOptions.map(option => {
                        if (option.children) {
                            const isExpanded = expandedGroups.has(option.value)
                            return (
                                <div key={option.value}>
                                    <button
                                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                                        onClick={() => toggleGroup(option.value)}
                                    >
                                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        <span>{option.label}</span>
                                    </button>
                                    {isExpanded && (
                                        <div className="ml-6">
                                            {option.children.map(child => (
                                                <button
                                                    key={child.value}
                                                    className={cn(
                                                        'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent',
                                                        value === child.value && 'bg-accent'
                                                    )}
                                                    onClick={() => handleSelect(child.value)}
                                                >
                                                    <span>{child.label}</span>
                                                    {value === child.value && <Check className="h-4 w-4" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        }

                        return (
                            <button
                                key={option.value}
                                className={cn(
                                    'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent',
                                    value === option.value && 'bg-accent'
                                )}
                                onClick={() => handleSelect(option.value)}
                            >
                                <span>{option.label}</span>
                                {value === option.value && <Check className="h-4 w-4" />}
                            </button>
                        )
                    })}
                </div>
            </PopoverContent>
        </Popover>
    )
}
