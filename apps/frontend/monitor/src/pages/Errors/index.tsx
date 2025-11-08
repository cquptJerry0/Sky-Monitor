/**
 * Errors Integration 主列表页面
 *
 * 业务逻辑：
 * 1. 展示应用的所有错误事件
 * 2. 提供多维度筛选（级别、时间、搜索）
 * 3. 展示错误趋势图表
 * 4. 点击查看错误详情
 *
 * 技术栈学习点：
 * 1. React Query (useQuery) - 数据请求和缓存
 * 2. Recharts - 数据可视化
 * 3. Tailwind CSS - 样式系统
 * 4. Shadcn/ui - UI 组件库
 */

import { useState } from 'react'
// React Query - 为什么用它？
// - 自动管理 loading、error、success 状态
// - 内置缓存机制，减少不必要的请求
// - 支持轮询、重试、预取等高级特性
// - 对比 Redux：专注于服务器状态，不需要写 reducer/action
import { useQuery } from '@tanstack/react-query'

// lucide-react - 图标库
// - 现代化的 SVG 图标
// - Tree-shaking 友好，按需引入
// - 对比 react-icons：体积更小，样式更统一
import { AlertCircle, TrendingUp, Users, Activity } from 'lucide-react'

// Recharts - 声明式图表库
// - React 原生组件，符合 React 开发习惯
// - 配置简单，声明式 API
// - 对比 Chart.js：更适合 React，API 更直观
// - 对比 ECharts：学习成本低，适合常规图表
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// date-fns - 日期处理
// - 函数式、不可变、支持 Tree-shaking
// - 对比 Moment.js：体积小，现代化，仍在维护
import { format } from 'date-fns'

// 自定义组件导入
import { FilterBar, FilterField } from '@/components/FilterBar'
import { StatCard } from '@/components/StatCard'
import { TimeRangePicker } from '@/components/TimeRangePicker'

// Shadcn/ui 组件 - 为什么用它？
// - 代码直接复制到项目，完全可控
// - 基于 Radix UI，无障碍性优秀
// - 使用 Tailwind 样式，风格统一
// - 对比 Ant Design：更轻量，定制更容易
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

// 服务层和类型
import * as errorService from '@/services/errors'
import { ErrorEvent } from '@/types/api'

import { ErrorDetailDialog } from './ErrorDetailDialog'

const levelColors = {
    error: 'destructive',
    warning: 'default',
    info: 'secondary',
} as const

export function Errors() {
    // ==================== 状态管理 ====================
    // 为什么用 useState 而不是 useReducer？
    // - 状态简单，没有复杂的状态转换逻辑
    // - useState 更直观，代码量少
    // - 如果状态逻辑复杂（如多个相关状态），才考虑 useReducer

    const [selectedAppId, setSelectedAppId] = useState<string>('')
    const [timeWindow, setTimeWindow] = useState<'hour' | 'day' | 'week'>('day')
    const [filters, setFilters] = useState({
        level: '',
        fingerprint: '',
        search: '',
    })
    const [selectedError, setSelectedError] = useState<ErrorEvent | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    // ==================== 数据请求 ====================
    // React Query 核心：useQuery Hook
    //
    // 学习要点：
    // 1. queryKey: 缓存标识符（数组）
    //    - 第一项通常是资源名称 ['errors']
    //    - 后面的项是查询参数 [selectedAppId, filters]
    //    - queryKey 变化时会自动重新请求
    //
    // 2. queryFn: 异步函数，返回 Promise
    //    - 这里调用我们的 service 层函数
    //    - 会自动处理 loading、error、success 状态
    //
    // 3. refetchInterval: 轮询间隔（毫秒）
    //    - 30000ms = 30秒自动刷新一次
    //    - 适合需要实时更新的数据
    //    - 窗口失焦时会暂停轮询（性能优化）
    //
    // 4. 返回值解构：
    //    - data: 请求成功的数据
    //    - isLoading: 首次加载中
    //    - error: 请求错误
    //    - isFetching: 后台刷新中
    //
    // 为什么不用 useEffect + fetch？
    // - 需要手动管理 loading、error 状态
    // - 需要手动处理缓存、重试、轮询
    // - 需要处理竞态条件（请求顺序问题）
    // - React Query 都帮你做了！
    const { data: errorsData, isLoading: isLoadingErrors } = useQuery({
        queryKey: ['errors', selectedAppId, filters],
        queryFn: () =>
            errorService.fetchErrors({
                appId: selectedAppId || undefined,
                level: filters.level as any,
                fingerprint: filters.fingerprint || undefined,
                limit: 50,
            }),
        refetchInterval: 30000, // 每30秒自动刷新
    })

    const { data: trendsData } = useQuery({
        queryKey: ['error-trends', selectedAppId, timeWindow],
        queryFn: () =>
            errorService.fetchErrorTrends({
                appId: selectedAppId || 'all',
                window: timeWindow,
                limit: 24,
            }),
        enabled: !!selectedAppId,
    })

    const errors = errorsData?.data?.data || []
    const trends = trendsData?.data || []

    const totalErrors = errorsData?.data?.total || 0
    const affectedUsers = trends.reduce((acc, t) => Math.max(acc, t.affected_users || 0), 0)
    const affectedSessions = trends.reduce((acc, t) => Math.max(acc, t.affected_sessions || 0), 0)
    const errorRate = totalErrors > 0 ? ((totalErrors / (totalErrors + 1000)) * 100).toFixed(2) : '0.00'

    const filterFields: FilterField[] = [
        {
            key: 'level',
            label: '错误级别',
            type: 'select',
            options: [
                { label: '错误', value: 'error' },
                { label: '警告', value: 'warning' },
                { label: '信息', value: 'info' },
            ],
        },
        {
            key: 'search',
            label: '搜索',
            type: 'search',
            placeholder: '搜索错误消息或指纹',
        },
    ]

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const handleResetFilters = () => {
        setFilters({ level: '', fingerprint: '', search: '' })
    }

    const handleRowClick = (error: ErrorEvent) => {
        setSelectedError(error)
        setDialogOpen(true)
    }

    // ==================== 图表数据处理 ====================
    // 将后端数据转换为 Recharts 需要的格式
    // Recharts 要求数据是对象数组，每个对象包含 x 轴和 y 轴的值
    const chartData = trends.map(trend => ({
        time: format(new Date(trend.time_bucket), timeWindow === 'hour' ? 'HH:mm' : 'MM-dd'),
        count: trend.count,
        occurrences: trend.total_occurrences,
    }))

    return (
        // ==================== 页面布局 ====================
        // Tailwind CSS 类名解析：
        // - flex flex-col: 垂直排列（主轴方向为列）
        // - gap-6: 子元素间距 1.5rem (6 * 0.25rem)
        // - p-6: 内边距 1.5rem
        //
        // 为什么用 Tailwind？
        // - 不需要离开 HTML/JSX，开发速度快
        // - 设计系统内置，样式一致性好
        // - PurgeCSS 自动移除未使用样式，打包体积小
        <div className="flex flex-col gap-6 p-6">
            {/* ========== 页面标题栏 ========== */}
            {/*
             * Tailwind 响应式设计：
             * - 默认 flex（移动端优先）
             * - items-center: 垂直居中对齐
             * - justify-between: 两端对齐（标题在左，时间选择器在右）
             */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">错误监控</h1>
                <TimeRangePicker
                    onChange={range => {
                        if (range?.from && range?.to) {
                            const days = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24))
                            if (days <= 1) setTimeWindow('hour')
                            else if (days <= 7) setTimeWindow('day')
                            else setTimeWindow('week')
                        }
                    }}
                />
            </div>

            {/* ========== 统计卡片区 ========== */}
            {/*
             * Tailwind 响应式网格：
             * - grid: 启用网格布局
             * - gap-4: 网格间距 1rem
             * - md:grid-cols-2: 中等屏幕（≥768px）显示2列
             * - lg:grid-cols-4: 大屏幕（≥1024px）显示4列
             *
             * 效果：
             * - 移动端：1列（垂直堆叠）
             * - 平板：2列
             * - 桌面：4列
             */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="总错误数" value={totalErrors} icon={AlertCircle} description="所有错误事件" />
                <StatCard title="今日新增" value={trends[trends.length - 1]?.count || 0} icon={TrendingUp} description="最近时间窗口" />
                <StatCard title="影响用户" value={affectedUsers} icon={Users} description="受影响的用户数" />
                <StatCard title="错误率" value={`${errorRate}%`} icon={Activity} description="错误 / 总事件" />
            </div>

            {/* ========== 错误趋势图 ========== */}
            {/*
             * Shadcn Card 组件：
             * - Card: 容器组件，提供边框、圆角、阴影
             * - CardHeader: 头部区域
             * - CardTitle: 标题
             * - CardContent: 内容区域
             *
             * 这些组件都是基于 Radix UI 封装的，样式可以完全自定义
             */}
            <Card>
                <CardHeader>
                    <CardTitle>错误趋势</CardTitle>
                </CardHeader>
                <CardContent>
                    {/*
                     * Recharts 核心组件：
                     *
                     * 1. ResponsiveContainer: 响应式容器
                     *    - width="100%": 占满父容器宽度
                     *    - height={300}: 固定高度 300px
                     *    - 自动监听窗口大小变化
                     *
                     * 2. LineChart: 折线图容器
                     *    - data: 数据数组
                     *
                     * 3. CartesianGrid: 网格线
                     *    - strokeDasharray="3 3": 虚线样式（3px 实线 + 3px 空白）
                     *
                     * 4. XAxis/YAxis: 坐标轴
                     *    - dataKey: 指定数据字段
                     *
                     * 5. Tooltip: 悬停提示框（自动显示）
                     *
                     * 6. Legend: 图例（自动生成）
                     *
                     * 7. Line: 折线
                     *    - type="monotone": 平滑曲线
                     *    - dataKey: 数据字段
                     *    - stroke: 线条颜色
                     *    - strokeWidth: 线条宽度
                     *
                     * 为什么用 Recharts？
                     * - 声明式 API，配置简单
                     * - React 原生，不需要操作 DOM
                     * - 对比 Chart.js：更符合 React 思维
                     * - 对比 ECharts：学习成本低，适合常规图表
                     */}
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="count" stroke="#ef4444" name="错误数" strokeWidth={2} />
                            <Line type="monotone" dataKey="occurrences" stroke="#f97316" name="总发生次数" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <FilterBar fields={filterFields} values={filters} onChange={handleFilterChange} onReset={handleResetFilters} />

            <Card>
                <CardHeader>
                    <CardTitle>错误列表</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoadingErrors ? (
                        <div className="text-center py-8 text-muted-foreground">加载中...</div>
                    ) : errors.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">暂无错误数据</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>级别</TableHead>
                                    <TableHead>错误消息</TableHead>
                                    <TableHead>指纹</TableHead>
                                    <TableHead>发生时间</TableHead>
                                    <TableHead>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {errors.map(error => (
                                    <TableRow
                                        key={error.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleRowClick(error)}
                                    >
                                        <TableCell>
                                            <Badge variant={levelColors[error.level]}>{error.level}</Badge>
                                        </TableCell>
                                        <TableCell className="max-w-md truncate">{error.message}</TableCell>
                                        <TableCell className="font-mono text-xs">{error.fingerprint?.substring(0, 8)}...</TableCell>
                                        <TableCell>{format(new Date(error.timestamp), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={e => {
                                                    e.stopPropagation()
                                                    handleRowClick(error)
                                                }}
                                            >
                                                查看详情
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {selectedError && <ErrorDetailDialog open={dialogOpen} onOpenChange={setDialogOpen} error={selectedError} />}
        </div>
    )
}
