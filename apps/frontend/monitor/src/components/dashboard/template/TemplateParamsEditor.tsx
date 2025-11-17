import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TemplateParams, TimeGranularity, WidgetTemplateMeta } from '@/types/dashboard'

interface TemplateParamsEditorProps {
    template: WidgetTemplateMeta
    appId: string | string[]
    onConfirm: (params: TemplateParams) => void
    onCancel: () => void
}

const TIME_GRANULARITY_LABELS: Record<TimeGranularity, string> = {
    minute: '分钟',
    hour: '小时',
    day: '天',
}

export function TemplateParamsEditor({ template, appId, onConfirm, onCancel }: TemplateParamsEditorProps) {
    const [params, setParams] = useState<TemplateParams>({
        appId,
        timeGranularity: 'hour',
        limit: 10,
    })

    const handleConfirm = () => {
        onConfirm(params)
    }

    const hasTimeGranularity = template.editableParams?.timeGranularity !== undefined
    const hasLimit = template.editableParams?.limit !== undefined

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">{template.name}</h2>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
                <Button variant="outline" onClick={onCancel}>
                    返回
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>配置参数</CardTitle>
                    <CardDescription>调整模板参数以满足您的需求</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {hasTimeGranularity && (
                        <div className="space-y-2">
                            <Label htmlFor="timeGranularity">时间粒度</Label>
                            <Select
                                value={params.timeGranularity || 'hour'}
                                onValueChange={value => setParams({ ...params, timeGranularity: value as TimeGranularity })}
                            >
                                <SelectTrigger id="timeGranularity">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {template.editableParams?.timeGranularity?.options.map(option => (
                                        <SelectItem key={option} value={option}>
                                            {TIME_GRANULARITY_LABELS[option]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {hasLimit && (
                        <div className="space-y-2">
                            <Label htmlFor="limit">显示数量 (Top N)</Label>
                            <Input
                                id="limit"
                                type="number"
                                min={template.editableParams?.limit?.min || 1}
                                max={template.editableParams?.limit?.max || 100}
                                value={params.limit || 10}
                                onChange={e => setParams({ ...params, limit: parseInt(e.target.value) || 10 })}
                            />
                        </div>
                    )}

                    {!hasTimeGranularity && !hasLimit && <p className="text-sm text-muted-foreground">此模板无需额外配置</p>}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onCancel}>
                    取消
                </Button>
                <Button onClick={handleConfirm}>确认创建</Button>
            </div>
        </div>
    )
}
