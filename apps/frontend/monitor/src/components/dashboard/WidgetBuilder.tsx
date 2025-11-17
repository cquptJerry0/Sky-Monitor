import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { QueryBuilder } from './QueryBuilder'
import { TemplateParamsEditor } from './TemplateParamsEditor'
import { TemplateSelector } from './TemplateSelector'
import type { DashboardWidget } from './types'
import { WidgetPreview } from './WidgetPreview'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDebounce } from '@/hooks/useDebounce'
import { useCreateWidget, useUpdateWidget } from '@/hooks/useDashboard'
import { useCreateWidgetFromTemplate } from '@/hooks/useWidgetTemplate'
import { useDashboardStore } from '@/stores/dashboard.store'
import type { CreateWidgetDto, QueryConfig, TemplateParams, WidgetTemplateMeta, WidgetType } from '@/types/dashboard'

interface WidgetBuilderProps {
    dashboardId: string
    open: boolean
    onOpenChange: (open: boolean) => void
    editingWidget?: DashboardWidget | null
}

type BuilderMode = 'select-template' | 'edit-params' | 'custom-query'

export function WidgetBuilder({ dashboardId, open, onOpenChange, editingWidget }: WidgetBuilderProps) {
    const { selectedAppId } = useDashboardStore()
    const createWidget = useCreateWidget()
    const updateWidget = useUpdateWidget()
    const createFromTemplate = useCreateWidgetFromTemplate()

    const isEditMode = !!editingWidget

    const [mode, setMode] = useState<BuilderMode>('select-template')
    const [selectedTemplate, setSelectedTemplate] = useState<WidgetTemplateMeta | null>(null)

    const [title, setTitle] = useState('')
    const [widgetType, setWidgetType] = useState<WidgetType>('line')
    const [query, setQuery] = useState<QueryConfig>({
        id: uuidv4(),
        fields: ['count()'],
        conditions: [],
        groupBy: [],
        legend: '查询 1',
    })

    const debouncedQuery = useDebounce(query, 500)

    useEffect(() => {
        if (editingWidget && open) {
            setMode('custom-query')
            setTitle(editingWidget.title)
            setWidgetType(editingWidget.widgetType)
            if (editingWidget.queries && editingWidget.queries.length > 0) {
                const firstQuery = editingWidget.queries[0]
                if (firstQuery) {
                    setQuery(firstQuery)
                }
            }
        } else if (!open) {
            setMode('select-template')
            setSelectedTemplate(null)
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

    const handleSelectTemplate = (template: WidgetTemplateMeta) => {
        setSelectedTemplate(template)
        setMode('edit-params')
    }

    const handleConfirmTemplate = async (params: TemplateParams) => {
        if (!selectedTemplate) return

        await createFromTemplate.mutateAsync({
            dashboardId,
            templateType: selectedTemplate.type,
            params,
        })

        onOpenChange(false)
    }

    const handleSubmit = async () => {
        if (!title.trim()) {
            return
        }

        if (isEditMode && editingWidget) {
            await updateWidget.mutateAsync({
                id: editingWidget.id,
                title,
                widgetType,
                queries: [query],
            })
        } else {
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

    if (mode === 'select-template' && !isEditMode) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>创建 Widget</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <TemplateSelector onSelect={handleSelectTemplate} />

                        <div className="flex justify-center pt-4 border-t">
                            <Button variant="outline" onClick={() => setMode('custom-query')}>
                                或使用自定义查询
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    if (mode === 'edit-params' && selectedTemplate && !isEditMode) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setMode('select-template')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <DialogTitle>配置模板参数</DialogTitle>
                        </div>
                    </DialogHeader>

                    <TemplateParamsEditor
                        template={selectedTemplate}
                        appId={selectedAppId || ''}
                        onConfirm={handleConfirmTemplate}
                        onCancel={() => setMode('select-template')}
                    />
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        {!isEditMode && (
                            <Button variant="ghost" size="sm" onClick={() => setMode('select-template')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <DialogTitle>{isEditMode ? '编辑 Widget' : '自定义 Widget'}</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
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
