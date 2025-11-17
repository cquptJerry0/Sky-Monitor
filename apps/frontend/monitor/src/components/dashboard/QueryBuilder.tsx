import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { QueryCondition, QueryConfig } from '@/components/dashboard/types'

interface QueryBuilderProps {
    query: QueryConfig
    onChange: (query: QueryConfig) => void
}

/**
 * 字段配置接口
 */
interface FieldConfig {
    value: string
    label: string
    category: string
    type: 'string' | 'number' | 'datetime'
    aggregatable: boolean
    groupable: boolean
}

/**
 * 聚合函数配置
 */
const AGGREGATION_FUNCTIONS = [
    { value: 'count()', label: '计数 (count)' },
    { value: 'count(DISTINCT {field})', label: '去重计数 (count distinct)' },
    { value: 'sum({field})', label: '求和 (sum)' },
    { value: 'avg({field})', label: '平均值 (avg)' },
    { value: 'min({field})', label: '最小值 (min)' },
    { value: 'max({field})', label: '最大值 (max)' },
] as const

/**
 * 操作符配置
 */
const OPERATORS = [
    { value: '=', label: '等于 (=)' },
    { value: '!=', label: '不等于 (!=)' },
    { value: '>', label: '大于 (>)' },
    { value: '<', label: '小于 (<)' },
    { value: '>=', label: '大于等于 (>=)' },
    { value: '<=', label: '小于等于 (<=)' },
    { value: 'IN', label: '包含于 (IN)' },
    { value: 'LIKE', label: '模糊匹配 (LIKE)' },
] as const

/**
 * 时间分组函数
 */
const TIME_GROUP_FUNCTIONS = [
    { value: 'toStartOfMinute(timestamp)', label: '按分钟' },
    { value: 'toStartOfFiveMinutes(timestamp)', label: '按 5 分钟' },
    { value: 'toStartOfTenMinutes(timestamp)', label: '按 10 分钟' },
    { value: 'toStartOfFifteenMinutes(timestamp)', label: '按 15 分钟' },
    { value: 'toStartOfHour(timestamp)', label: '按小时' },
    { value: 'toStartOfDay(timestamp)', label: '按天' },
    { value: 'toStartOfWeek(timestamp)', label: '按周' },
    { value: 'toStartOfMonth(timestamp)', label: '按月' },
] as const

/**
 * 可查询字段列表
 */
const QUERY_FIELDS: FieldConfig[] = [
    // 基础字段
    { value: 'app_id', label: '应用 ID', category: '基础', type: 'string', aggregatable: false, groupable: true },
    { value: 'event_type', label: '事件类型', category: '基础', type: 'string', aggregatable: false, groupable: true },
    { value: 'event_name', label: '事件名称', category: '基础', type: 'string', aggregatable: false, groupable: true },
    { value: 'path', label: '页面路径', category: '基础', type: 'string', aggregatable: false, groupable: true },
    { value: 'timestamp', label: '时间戳', category: '基础', type: 'datetime', aggregatable: false, groupable: true },

    // 错误相关
    { value: 'error_message', label: '错误消息', category: '错误', type: 'string', aggregatable: false, groupable: true },
    { value: 'error_fingerprint', label: '错误指纹', category: '错误', type: 'string', aggregatable: false, groupable: true },
    { value: 'error_lineno', label: '错误行号', category: '错误', type: 'number', aggregatable: true, groupable: true },
    { value: 'error_colno', label: '错误列号', category: '错误', type: 'number', aggregatable: true, groupable: true },

    // 设备信息
    { value: 'device_browser', label: '浏览器', category: '设备', type: 'string', aggregatable: false, groupable: true },
    { value: 'device_browser_version', label: '浏览器版本', category: '设备', type: 'string', aggregatable: false, groupable: true },
    { value: 'device_os', label: '操作系统', category: '设备', type: 'string', aggregatable: false, groupable: true },
    { value: 'device_os_version', label: '操作系统版本', category: '设备', type: 'string', aggregatable: false, groupable: true },
    { value: 'device_type', label: '设备类型', category: '设备', type: 'string', aggregatable: false, groupable: true },

    // 网络信息
    { value: 'network_type', label: '网络类型', category: '网络', type: 'string', aggregatable: false, groupable: true },
    { value: 'network_rtt', label: '网络延迟', category: '网络', type: 'number', aggregatable: true, groupable: false },

    // 框架信息
    { value: 'framework', label: '框架', category: '框架', type: 'string', aggregatable: false, groupable: true },
    { value: 'component_name', label: '组件名称', category: '框架', type: 'string', aggregatable: false, groupable: true },

    // HTTP 错误
    { value: 'http_url', label: 'HTTP URL', category: 'HTTP', type: 'string', aggregatable: false, groupable: true },
    { value: 'http_method', label: 'HTTP 方法', category: 'HTTP', type: 'string', aggregatable: false, groupable: true },
    { value: 'http_status', label: 'HTTP 状态码', category: 'HTTP', type: 'number', aggregatable: false, groupable: true },
    { value: 'http_duration', label: 'HTTP 耗时', category: 'HTTP', type: 'number', aggregatable: true, groupable: false },

    // 资源错误
    { value: 'resource_url', label: '资源 URL', category: '资源', type: 'string', aggregatable: false, groupable: true },
    { value: 'resource_type', label: '资源类型', category: '资源', type: 'string', aggregatable: false, groupable: true },

    // Session
    { value: 'session_id', label: '会话 ID', category: '会话', type: 'string', aggregatable: false, groupable: true },
    { value: 'session_duration', label: '会话时长', category: '会话', type: 'number', aggregatable: true, groupable: false },
    { value: 'session_event_count', label: '会话事件数', category: '会话', type: 'number', aggregatable: true, groupable: false },
    { value: 'session_error_count', label: '会话错误数', category: '会话', type: 'number', aggregatable: true, groupable: false },

    // User
    { value: 'user_id', label: '用户 ID', category: '用户', type: 'string', aggregatable: false, groupable: true },
    { value: 'user_email', label: '用户邮箱', category: '用户', type: 'string', aggregatable: false, groupable: true },
    { value: 'user_username', label: '用户名', category: '用户', type: 'string', aggregatable: false, groupable: true },

    // Performance
    { value: 'perf_category', label: '性能类别', category: '性能', type: 'string', aggregatable: false, groupable: true },
    { value: 'perf_value', label: '性能值', category: '性能', type: 'number', aggregatable: true, groupable: false },
    { value: 'perf_is_slow', label: '是否慢请求', category: '性能', type: 'number', aggregatable: false, groupable: true },

    // Metadata
    { value: 'environment', label: '环境', category: '元数据', type: 'string', aggregatable: false, groupable: true },
    { value: 'event_level', label: '事件级别', category: '元数据', type: 'string', aggregatable: false, groupable: true },
    { value: 'release', label: '版本号', category: '元数据', type: 'string', aggregatable: false, groupable: true },
    { value: 'dedup_count', label: '去重计数', category: '元数据', type: 'number', aggregatable: true, groupable: false },
]

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
        const existingCondition = newConditions[index]
        if (existingCondition) {
            newConditions[index] = { ...existingCondition, ...updates }
            onChange({ ...query, conditions: newConditions })
        }
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
