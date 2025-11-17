import { Code, Copy, Check } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SqlTemplate {
    id: string
    name: string
    description: string
    category: string
    sql: string
}

/**
 * SQL 模板库
 */
const SQL_TEMPLATES: SqlTemplate[] = [
    {
        id: 'error_count',
        name: '错误总数',
        description: '统计指定时间范围内的错误总数',
        category: '错误监控',
        sql: `SELECT count() as error_count
FROM monitor_events
WHERE event_type IN ('error', 'unhandledrejection')
  AND timestamp >= now() - INTERVAL 1 HOUR
  AND app_id = '{app_id}'`,
    },
    {
        id: 'error_trend',
        name: '错误趋势',
        description: '按小时统计错误趋势',
        category: '错误监控',
        sql: `SELECT 
  toStartOfHour(timestamp) as time,
  count() as error_count
FROM monitor_events
WHERE event_type IN ('error', 'unhandledrejection')
  AND timestamp >= now() - INTERVAL 24 HOUR
  AND app_id = '{app_id}'
GROUP BY time
ORDER BY time`,
    },
    {
        id: 'top_errors',
        name: 'Top 错误',
        description: '统计出现次数最多的错误',
        category: '错误监控',
        sql: `SELECT 
  error_message,
  count() as error_count
FROM monitor_events
WHERE event_type IN ('error', 'unhandledrejection')
  AND timestamp >= now() - INTERVAL 24 HOUR
  AND app_id = '{app_id}'
GROUP BY error_message
ORDER BY error_count DESC
LIMIT 10`,
    },
    {
        id: 'web_vitals',
        name: 'Web Vitals 趋势',
        description: '统计 Web Vitals 性能指标',
        category: '性能监控',
        sql: `SELECT 
  toStartOfHour(timestamp) as time,
  event_name,
  avg(perf_value) as avg_value
FROM monitor_events
WHERE event_type = 'webVital'
  AND event_name IN ('LCP', 'FCP', 'FID', 'CLS', 'TTFB', 'INP')
  AND timestamp >= now() - INTERVAL 24 HOUR
  AND app_id = '{app_id}'
GROUP BY time, event_name
ORDER BY time, event_name`,
    },
    {
        id: 'page_performance',
        name: '页面性能分析',
        description: '分析各页面的平均 LCP 性能',
        category: '性能监控',
        sql: `SELECT 
  path,
  avg(perf_value) as avg_lcp,
  count() as visit_count
FROM monitor_events
WHERE event_type = 'webVital'
  AND event_name = 'LCP'
  AND timestamp >= now() - INTERVAL 24 HOUR
  AND app_id = '{app_id}'
GROUP BY path
ORDER BY visit_count DESC
LIMIT 10`,
    },
    {
        id: 'active_users',
        name: '活跃用户数',
        description: '统计活跃用户数',
        category: '用户行为',
        sql: `SELECT count(DISTINCT user_id) as active_users
FROM monitor_events
WHERE timestamp >= now() - INTERVAL 1 HOUR
  AND app_id = '{app_id}'
  AND user_id != ''`,
    },
    {
        id: 'top_pages',
        name: 'Top 页面',
        description: '统计访问量最高的页面',
        category: '用户行为',
        sql: `SELECT 
  path,
  count() as visit_count
FROM monitor_events
WHERE timestamp >= now() - INTERVAL 24 HOUR
  AND app_id = '{app_id}'
  AND path != ''
GROUP BY path
ORDER BY visit_count DESC
LIMIT 10`,
    },
    {
        id: 'browser_distribution',
        name: '浏览器分布',
        description: '统计用户使用的浏览器分布',
        category: '设备环境',
        sql: `SELECT 
  device_browser,
  count() as user_count
FROM monitor_events
WHERE timestamp >= now() - INTERVAL 24 HOUR
  AND app_id = '{app_id}'
  AND device_browser != ''
GROUP BY device_browser
ORDER BY user_count DESC`,
    },
]

interface SqlTemplateLibraryProps {
    onSelectTemplate: (sql: string) => void
}

export function SqlTemplateLibrary({ onSelectTemplate }: SqlTemplateLibraryProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const handleCopy = (template: SqlTemplate) => {
        navigator.clipboard.writeText(template.sql)
        setCopiedId(template.id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const categories = Array.from(new Set(SQL_TEMPLATES.map(t => t.category)))

    return (
        <div className="space-y-4">
            {categories.map(category => (
                <div key={category}>
                    <h3 className="text-sm font-semibold mb-2">{category}</h3>
                    <div className="grid gap-2">
                        {SQL_TEMPLATES.filter(t => t.category === category).map(template => (
                            <Card key={template.id} className="hover:bg-accent/50 transition-colors">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <Code className="h-4 w-4" />
                                                {template.name}
                                            </CardTitle>
                                            <CardDescription className="text-xs mt-1">{template.description}</CardDescription>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => handleCopy(template)} className="h-8 w-8 p-0">
                                                {copiedId === template.id ? (
                                                    <Check className="h-3 w-3 text-green-600" />
                                                ) : (
                                                    <Copy className="h-3 w-3" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onSelectTemplate(template.sql)}
                                                className="h-8"
                                            >
                                                使用
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
