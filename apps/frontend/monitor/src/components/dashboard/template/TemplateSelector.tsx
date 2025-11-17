import { Activity, AlertCircle, Monitor, Users } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useWidgetTemplates } from '@/hooks/useWidgetTemplate'
import type { TemplateCategory, WidgetTemplateMeta } from '@/types/dashboard'

interface TemplateSelectorProps {
    onSelect: (template: WidgetTemplateMeta) => void
}

const categoryIcons: Record<TemplateCategory, React.ReactNode> = {
    performance: <Activity className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />,
    user: <Users className="h-4 w-4" />,
    device: <Monitor className="h-4 w-4" />,
}

const categoryLabels: Record<TemplateCategory, string> = {
    performance: '性能监控',
    error: '错误监控',
    user: '用户行为',
    device: '设备环境',
}

const widgetTypeLabels: Record<string, string> = {
    line: '折线图',
    bar: '柱状图',
    area: '面积图',
    table: '表格',
    big_number: '大数字',
    world_map: '地图',
}

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
    const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('performance')
    const { data: templatesData, isLoading } = useWidgetTemplates(selectedCategory)

    const templates = templatesData?.templates || []

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold mb-2">选择模板</h3>
                <p className="text-sm text-muted-foreground">从预设模板快速创建 Widget</p>
            </div>

            <Tabs value={selectedCategory} onValueChange={value => setSelectedCategory(value as TemplateCategory)}>
                <TabsList className="grid w-full grid-cols-4">
                    {(Object.keys(categoryLabels) as TemplateCategory[]).map(category => (
                        <TabsTrigger key={category} value={category} className="flex items-center gap-2">
                            {categoryIcons[category]}
                            <span className="hidden sm:inline">{categoryLabels[category]}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {(Object.keys(categoryLabels) as TemplateCategory[]).map(category => (
                    <TabsContent key={category} value={category} className="mt-4">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <Card key={i} className="animate-pulse">
                                        <CardHeader>
                                            <div className="h-4 bg-muted rounded w-3/4" />
                                            <div className="h-3 bg-muted rounded w-full mt-2" />
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">暂无模板</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {templates.map(template => (
                                    <Card
                                        key={template.type}
                                        className="cursor-pointer hover:border-primary transition-colors"
                                        onClick={() => onSelect(template)}
                                    >
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <CardTitle className="text-base">{template.name}</CardTitle>
                                                    <CardDescription className="mt-2">{template.description}</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant="secondary">
                                                    {widgetTypeLabels[template.widgetType] || template.widgetType}
                                                </Badge>
                                                {template.editableParams?.timeGranularity && <Badge variant="outline">可调时间粒度</Badge>}
                                                {template.editableParams?.limit && <Badge variant="outline">可调 Top N</Badge>}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}
