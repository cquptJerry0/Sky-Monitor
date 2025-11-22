import { ArrowLeft, Hash, Table } from 'lucide-react'
import { useState } from 'react'

import { SqlQueryBuilder } from '../sql/SqlQueryBuilder'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateWidget } from '@/hooks/useDashboard'
import { useCreateWidgetFromTemplate } from '@/hooks/useWidgetTemplate'
import { useCurrentAppId } from '@/hooks/useCurrentApp'
import type { CreateWidgetDto, EventFilter } from '@/types/dashboard'

interface WidgetBuilderProps {
    dashboardId: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

type BuilderMode = 'select-mode' | 'quick-create' | 'custom-sql'

export function WidgetBuilder({ dashboardId, open, onOpenChange }: WidgetBuilderProps) {
    const currentAppId = useCurrentAppId()
    const createWidget = useCreateWidget()
    const createFromTemplate = useCreateWidgetFromTemplate()

    const [mode, setMode] = useState<BuilderMode>('select-mode')
    const [title, setTitle] = useState('')
    const [widgetType, setWidgetType] = useState<'big_number' | 'line'>('big_number')
    const [eventFilter, setEventFilter] = useState<EventFilter>('all')
    const [rawSql, setRawSql] = useState('')

    const handleReset = () => {
        setMode('select-mode')
        setTitle('')
        setWidgetType('big_number')
        setEventFilter('all')
        setRawSql('')
    }

    const handleQuickCreate = async () => {
        if (!title.trim()) return

        await createFromTemplate.mutateAsync({
            dashboardId,
            templateType: 'quick_create',
            title,
            widgetType,
            eventFilter,
        })

        handleReset()
        onOpenChange(false)
    }

    const handleCreateCustomSQL = async () => {
        if (!title.trim() || !rawSql.trim()) return

        const queryConfig = {
            id: crypto.randomUUID(),
            rawSql,
            fields: [],
            conditions: [],
            legend: title,
        }

        const widgetData: CreateWidgetDto = {
            dashboardId,
            title,
            widgetType: 'table',
            queries: [queryConfig],
            layout: {
                x: 0,
                y: 0,
                w: 12,
                h: 6,
            },
        }

        await createWidget.mutateAsync(widgetData)

        handleReset()
        onOpenChange(false)
    }

    // 选择创建方式
    if (mode === 'select-mode') {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>创建 Widget</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4 py-6">
                        <Button variant="outline" className="h-32 flex flex-col gap-2" onClick={() => setMode('quick-create')}>
                            <Hash className="h-12 w-12" />
                            <div className="text-sm">快速创建</div>
                            <div className="text-xs text-muted-foreground">选择图表类型和筛选条件</div>
                        </Button>

                        <Button variant="outline" className="h-32 flex flex-col gap-2" onClick={() => setMode('custom-sql')}>
                            <Table className="h-12 w-12" />
                            <div className="text-sm">自定义 SQL</div>
                            <div className="text-xs text-muted-foreground">使用SQL查询创建表格</div>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    // 快速创建模式
    if (mode === 'quick-create') {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setMode('select-mode')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <DialogTitle>快速创建 Widget</DialogTitle>
                        </div>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Widget 标题</Label>
                            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="例如: 错误趋势" />
                        </div>

                        <div className="space-y-2">
                            <Label>图表类型</Label>
                            <Select value={widgetType} onValueChange={value => setWidgetType(value as 'big_number' | 'line')}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="big_number">大数字</SelectItem>
                                    <SelectItem value="line">折线图</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>事件筛选</Label>
                            <Select value={eventFilter} onValueChange={value => setEventFilter(value as EventFilter)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全部事件</SelectItem>
                                    <SelectItem value="error">错误相关 (error + exception + unhandledrejection)</SelectItem>
                                    <SelectItem value="performance">性能相关 (performance + webVital)</SelectItem>
                                    <SelectItem value="user_behavior">用户行为 (custom + message)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="text-sm text-muted-foreground">
                            {widgetType === 'big_number' ? '大数字: 显示事件总数' : '折线图: X轴为时间(按小时), Y轴为事件总数'}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMode('select-mode')}>
                            返回
                        </Button>
                        <Button onClick={handleQuickCreate} disabled={!title.trim() || createFromTemplate.isPending}>
                            {createFromTemplate.isPending ? '创建中...' : '创建'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    // 自定义SQL模式
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setMode('select-mode')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <DialogTitle>自定义 SQL Widget</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Widget 标题</Label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="输入 Widget 标题" />
                    </div>

                    <div className="space-y-2">
                        <Label>SQL 查询</Label>
                        <SqlQueryBuilder sql={rawSql} onChange={setRawSql} />
                    </div>

                    <div className="text-sm text-muted-foreground">将创建一个表格类型的 Widget,显示查询结果</div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setMode('select-mode')}>
                        返回
                    </Button>
                    <Button onClick={handleCreateCustomSQL} disabled={!title.trim() || !rawSql.trim() || createWidget.isPending}>
                        {createWidget.isPending ? '创建中...' : '创建'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
