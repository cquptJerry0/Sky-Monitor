import { ExternalLink } from 'lucide-react'
import { Bar, BarChart, Label, Rectangle, ReferenceLine, XAxis } from 'recharts'

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Separator } from '@/components/ui/separator'

export type MetricType = 'fp' | 'fcp' | 'lcp' | 'fid' | 'cls'

const typeToTitleMap: Record<MetricType, string> = {
    fp: 'First Paint (FP)',
    fcp: 'First Contentful Paint (FCP)',
    lcp: 'Largest Contentful Paint (LCP)',
    fid: 'First Input Delay (FID)',
    cls: 'Cumulative Layout Shift (CLS)',
}

// const typeToDescriptionMap: Record<MetricType, string> = {
//     fp: 'Render time of the first pixel loaded in the viewport (may overlap with FCP).',
//     fcp: 'Render time of the first piece of content loaded in the viewport.',
//     lcp: 'Render time of the largest piece of content loaded in the viewport.',
//     fid: 'Time between the first user interaction and the browser response.',
//     cls: 'Sum of all layout shifts during the page load.',
// }
const typeToDescriptionMap: Record<MetricType, string> = {
    fp: '视口中加载的第一个像素的渲染时间（可能与 FCP 重叠）',
    fcp: '视口中加载的第一个内容的渲染时间',
    lcp: '视区中加载的最大内容的渲染时间',
    fid: '首次用户交互与浏览器响应之间的时间',
    cls: '页面加载过程中所有布局移动的总和',
}

const typeToDocsMap: Record<MetricType, string> = {
    fp: 'https://web.dev/articles/fcp?hl=zh-cn',
    fcp: 'https://web.dev/articles/fcp?hl=zh-cn',
    lcp: 'https://web.dev/articles/lcp?hl=zh-cn',
    fid: 'https://web.dev/articles/fid?hl=zh-cn',
    cls: 'https://web.dev/articles/cls?hl=zh-cn',
}

const typeToColorMap: Record<MetricType, string> = {
    fp: 'var(--chart-1)',
    fcp: 'var(--chart-2)',
    lcp: 'var(--chart-3)',
    fid: 'var(--chart-4)',
    cls: 'var(--chart-5)',
}

export interface MetricCardProps {
    type: MetricType
    value?: number
    metrics: {
        ms: number
        count: number
    }[]
}

export function MetricCard(props: MetricCardProps) {
    const { type, value, metrics } = props
    const title = typeToTitleMap[type]
    const summaryValue = value !== undefined ? `${value.toFixed(2)}ms` : '-'
    const description = typeToDescriptionMap[type]
    const color = typeToColorMap[type]
    const doc = typeToDocsMap[type]

    const average = metrics.reduce((acc, curr) => acc + curr.count, 0) / metrics.length

    return (
        <div className="flex flex-row h-52">
            <div className="flex flex-col w-[390px] p-6 gap-4 self-center">
                <div className="flex flex-row items-center text-base text-gray-500">
                    {title}
                    <a href={doc} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                </div>
                <div className="text-3xl text-gray-700 font-bold">{summaryValue}</div>
                <div className="text-sm text-gray-500">{description}</div>
            </div>
            <Separator orientation="vertical" className="self-stretch" />
            <div className="w-full px-6 pt-2">
                {!!metrics.length && (
                    <ChartContainer
                        className="w-full h-full"
                        config={{
                            steps: {
                                label: 'Steps',
                                color: `hsl(${color})`,
                            },
                        }}
                    >
                        <BarChart accessibilityLayer data={metrics}>
                            <Bar
                                dataKey="count"
                                fill="var(--color-steps)"
                                radius={5}
                                fillOpacity={0.6}
                                activeBar={<Rectangle fillOpacity={0.8} />}
                            />
                            <XAxis
                                dataKey="ms"
                                tickLine={false}
                                axisLine={false}
                                minTickGap={60}
                                tickFormatter={value => {
                                    return `${value}ms`
                                }}
                            />
                            <ChartTooltip
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(_, payload) => {
                                            const ms = payload[0]?.payload?.ms
                                            return ms !== undefined ? `${ms}ms` : '-'
                                        }}
                                    />
                                }
                            />
                            <ReferenceLine y={average} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeWidth={1}>
                                <Label position="insideBottomLeft" value="均值" offset={10} fill="hsl(var(--foreground))" />
                                <Label
                                    position="insideTopLeft"
                                    value={average.toFixed(2)}
                                    className="text-lg"
                                    fill="hsl(var(--foreground))"
                                    offset={10}
                                    startOffset={100}
                                    formatter={(value: string) => `${value}ms`}
                                />
                            </ReferenceLine>
                        </BarChart>
                    </ChartContainer>
                )}
            </div>
        </div>
    )
}
