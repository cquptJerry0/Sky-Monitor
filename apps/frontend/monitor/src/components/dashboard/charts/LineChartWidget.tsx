import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { ExecuteQueryResponse, QueryResultDataPoint } from '@/types'

interface LineChartWidgetProps {
    data: ExecuteQueryResponse
}

// 颜色配置 (6 种颜色循环使用)
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a78bfa', '#fb923c']

/**
 * 折线图组件
 *
 * ## 核心功能
 * - 使用 Recharts 渲染折线图
 * - 支持多系列数据 (多条折线)
 * - 自动合并多个查询结果
 * - 响应式布局
 *
 * ## 数据流
 * 1. 接收 ExecuteQueryResponse (包含多个查询结果)
 * 2. transformData() 转换为 Recharts 需要的格式
 * 3. Recharts 渲染折线图
 *
 * ## 数据格式转换
 * - 输入: ExecuteQueryResponse.results[] (多个查询结果)
 * - 输出: QueryResultDataPoint[] (Recharts 数据格式)
 *
 * ## 示例
 * 输入:
 * ```
 * results: [
 *   { queryId: 'q1', legend: '错误数', data: [{ time: '10:00', count: 10 }, { time: '11:00', count: 20 }] },
 *   { queryId: 'q2', legend: '警告数', data: [{ time: '10:00', count: 5 }, { time: '11:00', count: 15 }] }
 * ]
 * ```
 * 输出:
 * ```
 * [
 *   { name: '10:00', '错误数': 10, '警告数': 5 },
 *   { name: '11:00', '错误数': 20, '警告数': 15 }
 * ]
 * ```
 */
export function LineChartWidget({ data }: LineChartWidgetProps) {
    // 转换数据格式为 Recharts 需要的格式
    const chartData = transformData(data)

    // 空状态处理
    if (chartData.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>暂无数据</p>
            </div>
        )
    }

    // 获取所有系列的字段名 (用于渲染多条折线)
    const seriesKeys = data.results.map(result => result.legend || result.queryId)

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {/* 渲染多条折线 */}
                {seriesKeys.map((key, index) => (
                    <Line
                        key={key}
                        type="monotone" // 平滑曲线
                        dataKey={key} // 数据字段名
                        stroke={COLORS[index % COLORS.length]} // 循环使用颜色
                        strokeWidth={2}
                        dot={{ r: 3 }} // 数据点大小
                        activeDot={{ r: 5 }} // 悬停时数据点大小
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    )
}

/**
 * 转换数据格式
 *
 * ## 功能
 * 将多个查询结果合并为 Recharts 需要的格式
 *
 * ## 处理逻辑
 * 1. **单系列**: 直接映射为 { name: xValue, [legend]: yValue }
 * 2. **多系列**: 按 X 轴值合并，生成 { name: xValue, [legend1]: yValue1, [legend2]: yValue2 }
 *
 * ## 字段映射规则
 * - X 轴: 第一个字段 (通常是时间或分类)
 * - Y 轴: 第二个字段 (通常是聚合值，如 count、avg)
 * - 系列名: result.legend 或 result.queryId
 *
 * ## 示例 1: 单系列
 * 输入:
 * ```
 * results: [
 *   { queryId: 'q1', legend: '错误数', data: [{ time: '10:00', count: 10 }, { time: '11:00', count: 20 }] }
 * ]
 * ```
 * 输出:
 * ```
 * [
 *   { name: '10:00', '错误数': 10 },
 *   { name: '11:00', '错误数': 20 }
 * ]
 * ```
 *
 * ## 示例 2: 多系列
 * 输入:
 * ```
 * results: [
 *   { queryId: 'q1', legend: '错误数', data: [{ time: '10:00', count: 10 }, { time: '11:00', count: 20 }] },
 *   { queryId: 'q2', legend: '警告数', data: [{ time: '10:00', count: 5 }, { time: '11:00', count: 15 }] }
 * ]
 * ```
 * 输出:
 * ```
 * [
 *   { name: '10:00', '错误数': 10, '警告数': 5 },
 *   { name: '11:00', '错误数': 20, '警告数': 15 }
 * ]
 * ```
 *
 * @param data - 查询响应数据
 * @returns Recharts 数据格式
 */
function transformData(data: ExecuteQueryResponse): QueryResultDataPoint[] {
    if (!data.results || data.results.length === 0) {
        return []
    }

    // 单系列: 直接映射
    if (data.results.length === 1) {
        const result = data.results[0]
        if (!result) return []

        return result.data.map(row => {
            const keys = Object.keys(row)
            const xKey = keys[0] // 第一个字段作为 X 轴
            const yKey = keys[1] || keys[0] // 第二个字段作为 Y 轴

            if (!xKey || !yKey) return { name: '' }

            return {
                name: String(row[xKey]),
                [result.legend || result.queryId]: row[yKey],
            }
        })
    }

    // 多系列: 按 X 轴值合并数据
    const mergedData = new Map<string, QueryResultDataPoint>()

    data.results.forEach(result => {
        if (!result) return

        const seriesName = result.legend || result.queryId

        result.data.forEach(row => {
            const keys = Object.keys(row)
            const xKey = keys[0]
            const yKey = keys[1] || keys[0]

            if (!xKey || !yKey) return

            const xValue = String(row[xKey])

            // 如果 X 轴值不存在，创建新的数据点
            if (!mergedData.has(xValue)) {
                mergedData.set(xValue, { name: xValue })
            }

            // 添加当前系列的 Y 轴值
            const point = mergedData.get(xValue)
            if (point) {
                point[seriesName] = row[yKey]
            }
        })
    })

    return Array.from(mergedData.values())
}
