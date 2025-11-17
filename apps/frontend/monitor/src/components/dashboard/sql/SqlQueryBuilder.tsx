import { Code2, BookOpen } from 'lucide-react'
import { useState } from 'react'

import { SqlEditor } from './SqlEditor'
import { SqlTemplateLibrary } from './SqlTemplateLibrary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SqlQueryBuilderProps {
    sql: string
    onChange: (sql: string) => void
}

/**
 * SQL 查询构建器
 * 支持直接编写 SQL 或从模板库选择
 */
export function SqlQueryBuilder({ sql, onChange }: SqlQueryBuilderProps) {
    const [activeTab, setActiveTab] = useState<'editor' | 'templates'>('editor')

    const handleSelectTemplate = (templateSql: string) => {
        onChange(templateSql)
        setActiveTab('editor')
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Code2 className="h-4 w-4" />
                        高级 SQL 查询
                    </CardTitle>
                    <CardDescription>直接编写 ClickHouse SQL 查询语句,或从模板库选择</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'editor' | 'templates')}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="editor" className="flex items-center gap-2">
                                <Code2 className="h-4 w-4" />
                                SQL 编辑器
                            </TabsTrigger>
                            <TabsTrigger value="templates" className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                模板库
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="editor" className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">支持 ClickHouse SQL 语法,字段自动补全,语法验证</p>
                                    <Button variant="outline" size="sm" onClick={() => setActiveTab('templates')}>
                                        浏览模板
                                    </Button>
                                </div>
                                <SqlEditor value={sql} onChange={onChange} height="400px" />
                            </div>

                            <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                                <p className="font-medium">提示:</p>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    <li>使用 Ctrl+Space 触发字段自动补全</li>
                                    <li>查询必须包含 SELECT 和 FROM 关键字</li>
                                    <li>建议使用 monitor_events 表</li>
                                    <li>使用 {'{app_id}'} 作为应用 ID 占位符</li>
                                </ul>
                            </div>
                        </TabsContent>

                        <TabsContent value="templates" className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">从预设模板快速开始,点击"使用"按钮应用模板</p>
                                <div className="max-h-[500px] overflow-y-auto pr-2">
                                    <SqlTemplateLibrary onSelectTemplate={handleSelectTemplate} />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
