import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { QueryBuilder } from './QueryBuilder'
import { WidgetPreview } from './WidgetPreview'
import type { DashboardWidget } from './types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDebounce } from '@/hooks/useDebounce'
import { useCreateWidget, useUpdateWidget } from '@/hooks/useDashboard'
import { useDashboardStore } from '@/stores/dashboard.store'
import type { CreateWidgetDto, QueryConfig, WidgetType } from '@/components/dashboard/types'

interface WidgetBuilderProps {
    dashboardId: string
    open: boolean
    onOpenChange: (open: boolean) => void
    editingWidget?: DashboardWidget | null
}

/**
 * Widget 构建器弹窗
 */
export function WidgetBuilder({ dashboardId, open, onOpenChange, editingWidget }: WidgetBuilderProps) {
    const { timeRange, selectedAppId } = useDashboardStore()
    const createWidget = useCreateWidget()
    const updateWidget = useUpdateWidget()

    const isEditMode = !!editingWidget

    // Widget 配置
    const [title, setTitle] = useState('')
    const [widgetType, setWidgetType] = useState<WidgetType>('line')
    const [query, setQuery] = useState<QueryConfig>({
        id: uuidv4(),
        fields: ['count()'],
        conditions: [],
        groupBy: [],
        legend: '查询 1',
    })

    // 防抖查询配置
    const debouncedQuery = useDebounce(query, 500)

    // 当编辑 Widget 时,初始化表单
    useEffect(() => {
        if (editingWidget && open) {
            setTitle(editingWidget.title)
            setWidgetType(editingWidget.widgetType)
            if (editingWidget.queries && editingWidget.queries.length > 0) {
                const firstQuery = editingWidget.queries[0]
                if (firstQuery) {
                    setQuery(firstQuery)
                }
            }
        } else if (!open) {
            // 关闭弹窗时重置表单
            setTitle('')
            setWidgetType('line')
            setQuery({
                id: uuidv4(),
                fields: ['count()'],
                conditions: [],
                groupBy: [],
                legend: '查询 1',
            })
        }
    }, [editingWidget, open])

    // 创建或更新 Widget
    const handleSubmit = async () => {
        if (!title.trim()) {
            return
        }

        if (isEditMode && editingWidget) {
            // 更新模式
            await updateWidget.mutateAsync({
                id: editingWidget.id,
                title,
                widgetType,
                queries: [query],
            })
        } else {
            // 创建模式
            const widgetData: CreateWidgetDto = {
                dashboardId,
                title,
                widgetType,
                queries: [query],
                layout: {
                    x: 0,
                    y: 0,
                    w: 6,
                    h: 4,
                },
            }
            await createWidget.mutateAsync(widgetData)
        }

        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? '编辑 Widget' : '创建 Widget'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* 基础配置 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Widget 标题</Label>
                            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="输入 Widget 标题" />
                        </div>

                        <div className="space-y-2">
                            <Label>图表类型</Label>
                            <Select value={widgetType} onValueChange={value => setWidgetType(value as WidgetType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="line">折线图</SelectItem>
                                    <SelectItem value="bar">柱状图</SelectItem>
                                    <SelectItem value="area">面积图</SelectItem>
                                    <SelectItem value="table">表格</SelectItem>
                                    <SelectItem value="big_number">大数字</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* 查询构建器和预览 */}
                    <Tabs defaultValue="query" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="query">查询配置</TabsTrigger>
                            <TabsTrigger value="preview">预览</TabsTrigger>
                        </TabsList>

                        <TabsContent value="query" className="space-y-4">
                            <QueryBuilder query={query} onChange={setQuery} />
                        </TabsContent>

                        <TabsContent value="preview">
                            <WidgetPreview widgetType={widgetType} title={title || '未命名 Widget'} data={undefined} isLoading={false} />
                        </TabsContent>
                    </Tabs>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button onClick={handleSubmit} disabled={!title.trim() || createWidget.isPending || updateWidget.isPending}>
                        {isEditMode ? (updateWidget.isPending ? '保存中...' : '保存') : createWidget.isPending ? '创建中...' : '创建'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
