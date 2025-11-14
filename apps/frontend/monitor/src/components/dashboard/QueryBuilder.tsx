import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AGGREGATION_FUNCTIONS, OPERATORS, QUERY_FIELDS, TIME_GROUP_FUNCTIONS } from '@/config/queryFields'
import type { QueryCondition, QueryConfig } from '@/types/dashboard'

interface QueryBuilderProps {
    query: QueryConfig
    onChange: (query: QueryConfig) => void
}

/**
 * 查询构建器组件
 */
export function QueryBuilder({ query, onChange }: QueryBuilderProps) {
    const [selectedField, setSelectedField] = useState<string>('')

    // 添加字段
    const handleAddField = () => {
        if (!selectedField) return

        const newFields = [...query.fields, selectedField]
        onChange({ ...query, fields: newFields })
        setSelectedField('')
    }

    // 删除字段
    const handleRemoveField = (index: number) => {
        const newFields = query.fields.filter((_, i) => i !== index)
        onChange({ ...query, fields: newFields })
    }

    // 添加条件
    const handleAddCondition = () => {
        const newCondition: QueryCondition = {
            field: 'event_type',
            operator: '=',
            value: '',
        }
        onChange({
            ...query,
            conditions: [...(query.conditions || []), newCondition],
        })
    }

    // 更新条件
    const handleUpdateCondition = (index: number, updates: Partial<QueryCondition>) => {
        const newConditions = [...(query.conditions || [])]
        newConditions[index] = { ...newConditions[index], ...updates }
        onChange({ ...query, conditions: newConditions })
    }

    // 删除条件
    const handleRemoveCondition = (index: number) => {
        const newConditions = (query.conditions || []).filter((_, i) => i !== index)
        onChange({ ...query, conditions: newConditions })
    }

    // 添加分组
    const handleAddGroupBy = () => {
        onChange({
            ...query,
            groupBy: [...(query.groupBy || []), 'event_type'],
        })
    }

    // 更新分组
    const handleUpdateGroupBy = (index: number, value: string) => {
        const newGroupBy = [...(query.groupBy || [])]
        newGroupBy[index] = value
        onChange({ ...query, groupBy: newGroupBy })
    }

    // 删除分组
    const handleRemoveGroupBy = (index: number) => {
        const newGroupBy = (query.groupBy || []).filter((_, i) => i !== index)
        onChange({ ...query, groupBy: newGroupBy })
    }

    return (
        <div className="space-y-6">
            {/* 字段选择 */}
            <div className="space-y-2">
                <Label>查询字段</Label>
                <div className="flex gap-2">
                    <Select value={selectedField} onValueChange={setSelectedField}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="选择字段或聚合函数" />
                        </SelectTrigger>
                        <SelectContent>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">聚合函数</div>
                            {AGGREGATION_FUNCTIONS.map(fn => (
                                <SelectItem key={fn.value} value={fn.value}>
                                    {fn.label}
                                </SelectItem>
                            ))}
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">字段</div>
                            {QUERY_FIELDS.map(field => (
                                <SelectItem key={field.value} value={field.value}>
                                    {field.label} ({field.category})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleAddField} disabled={!selectedField}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                {/* 已选字段列表 */}
                {query.fields.length > 0 && (
                    <div className="space-y-1">
                        {query.fields.map((field, index) => (
                            <div key={index} className="flex items-center gap-2 rounded border p-2">
                                <span className="flex-1 text-sm">{field}</span>
                                <Button variant="ghost" size="sm" onClick={() => handleRemoveField(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 过滤条件 */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>过滤条件</Label>
                    <Button variant="outline" size="sm" onClick={handleAddCondition}>
                        <Plus className="mr-2 h-4 w-4" />
                        添加条件
                    </Button>
                </div>

                {(query.conditions || []).map((condition, index) => (
                    <div key={index} className="flex gap-2 rounded border p-2">
                        <Select value={condition.field} onValueChange={value => handleUpdateCondition(index, { field: value })}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {QUERY_FIELDS.map(field => (
                                    <SelectItem key={field.value} value={field.value}>
                                        {field.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={condition.operator}
                            onValueChange={value =>
                                handleUpdateCondition(index, {
                                    operator: value as QueryCondition['operator'],
                                })
                            }
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {OPERATORS.map(op => (
                                    <SelectItem key={op.value} value={op.value}>
                                        {op.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Input
                            value={String(condition.value)}
                            onChange={e => handleUpdateCondition(index, { value: e.target.value })}
                            placeholder="值"
                            className="flex-1"
                        />

                        <Button variant="ghost" size="sm" onClick={() => handleRemoveCondition(index)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>

            {/* 分组 */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>分组</Label>
                    <Button variant="outline" size="sm" onClick={handleAddGroupBy}>
                        <Plus className="mr-2 h-4 w-4" />
                        添加分组
                    </Button>
                </div>

                {(query.groupBy || []).map((groupBy, index) => (
                    <div key={index} className="flex gap-2 rounded border p-2">
                        <Select value={groupBy} onValueChange={value => handleUpdateGroupBy(index, value)}>
                            <SelectTrigger className="flex-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">时间分组</div>
                                {TIME_GROUP_FUNCTIONS.map(fn => (
                                    <SelectItem key={fn.value} value={fn.value}>
                                        {fn.label}
                                    </SelectItem>
                                ))}
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">字段分组</div>
                                {QUERY_FIELDS.filter(f => f.groupable).map(field => (
                                    <SelectItem key={field.value} value={field.value}>
                                        {field.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button variant="ghost" size="sm" onClick={() => handleRemoveGroupBy(index)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}
