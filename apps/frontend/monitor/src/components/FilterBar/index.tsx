/**
 * FilterBar - 通用筛选栏组件
 *
 * 业务逻辑：
 * 提供统一的筛选UI，支持多种筛选类型（下拉选择、搜索框）
 * 可用于任何需要数据筛选的页面（Errors、Performance、Sessions等）
 *
 * 组件设计原则：
 * 1. 单一职责：只负责筛选UI，不关心具体的业务逻辑
 * 2. 可组合：通过配置 fields 灵活定义筛选项
 * 3. 可复用：适用于不同的业务场景
 * 4. 受控组件：values 和 onChange 由父组件控制
 *
 * 技术要点：
 * 1. TypeScript 接口设计
 * 2. Shadcn Select 组件使用
 * 3. Tailwind 响应式布局
 * 4. 受控组件模式
 */

import { ReactNode } from 'react'
import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

// ==================== 类型定义 ====================
// 为什么要定义清晰的接口？
// 1. TypeScript 类型检查，编译时发现错误
// 2. IDE 智能提示，开发体验好
// 3. 自文档化，接口即文档
// 4. 重构安全，改接口时立即发现影响范围

export interface FilterOption {
    label: string // 显示文本
    value: string // 实际值
}

export interface FilterField {
    key: string // 字段标识符，对应 values 的 key
    label: string // 显示标签
    type: 'select' | 'multiSelect' | 'search' // 筛选类型
    options?: FilterOption[] // 下拉选项（select 类型必需）
    placeholder?: string // 占位符文本
}

// 组件 Props 接口
// 为什么用 Record<string, any>？
// - values 的结构取决于 fields 配置，是动态的
// - 可以考虑用泛型改进类型安全：FilterBarProps<T extends Record<string, any>>
interface FilterBarProps {
    fields: FilterField[] // 筛选字段配置
    values: Record<string, any> // 当前筛选值
    onChange: (key: string, value: any) => void // 值变化回调
    onReset?: () => void // 重置回调（可选）
    className?: string // 自定义样式类
}

export function FilterBar({ fields, values, onChange, onReset, className }: FilterBarProps) {
    return (
        // ==================== 容器样式 ====================
        // Tailwind 类名解析：
        // - flex flex-wrap: 弹性布局，允许换行
        // - items-center: 垂直居中对齐
        // - gap-4: 子元素间距 1rem
        // - p-4: 内边距 1rem
        // - bg-muted/40: 背景色（muted 色 + 40% 透明度）
        // - rounded-lg: 大圆角 (0.5rem)
        //
        // cn() 函数：
        // - 来自 @/lib/utils，基于 clsx 和 tailwind-merge
        // - 合并多个 className，自动去重和冲突解决
        // - 示例：cn('text-red-500', condition && 'text-blue-500')
        <div className={cn('flex flex-wrap items-center gap-4 p-4 bg-muted/40 rounded-lg', className)}>
            {/* ========== 遍历渲染筛选字段 ========== */}
            {/*
             * 为什么用配置驱动？
             * - 避免重复代码
             * - 易于维护和扩展
             * - 父组件可以灵活配置筛选项
             */}
            {fields.map(field => {
                // ========== 下拉选择框 ==========
                if (field.type === 'select') {
                    return (
                        <div key={field.key} className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">{field.label}:</span>
                            {/*
                             * Shadcn Select 组件：
                             *
                             * 组合模式（Composition Pattern）：
                             * - Select: 容器组件（状态管理）
                             * - SelectTrigger: 触发按钮
                             * - SelectValue: 显示当前值
                             * - SelectContent: 下拉内容
                             * - SelectItem: 选项
                             *
                             * 为什么用组合模式？
                             * - 灵活性：可以自由组合子组件
                             * - 可控性：每个部分都可以自定义
                             * - 对比 Ant Design Select：Ant Design 是单个组件，定制受限
                             *
                             * 受控组件模式：
                             * - value={values[field.key]}: 由父组件控制
                             * - onValueChange={...}: 通知父组件更新
                             * - 单向数据流：数据向下，事件向上
                             */}
                            <Select value={values[field.key]} onValueChange={value => onChange(field.key, value)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder={field.placeholder || `选择${field.label}`} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">全部</SelectItem>
                                    {field.options?.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )
                }

                // ========== 搜索框 ==========
                if (field.type === 'search') {
                    return (
                        // flex-1: 占据剩余空间
                        // min-w-[200px]: 最小宽度 200px（防止太窄）
                        <div key={field.key} className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">{field.label}:</span>
                            {/*
                             * 相对定位容器 + 绝对定位图标
                             * 实现图标在输入框内的效果
                             */}
                            <div className="relative flex-1">
                                {/*
                                 * 图标定位技巧：
                                 * - absolute: 绝对定位
                                 * - left-2: 距左 0.5rem
                                 * - top-1/2: 距顶 50%
                                 * - -translate-y-1/2: 向上平移自身高度的50%（实现垂直居中）
                                 *
                                 * 为什么用 Tailwind 的定位？
                                 * - 不需要写 CSS，直接在 JSX 中完成
                                 * - 响应式友好，可以加前缀 md:left-4
                                 * - 对比传统 CSS：需要单独文件，类名管理
                                 */}
                                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                {/*
                                 * 受控组件模式：
                                 * - value 由父组件控制
                                 * - onChange 通知父组件
                                 * - pl-8: 左边距为图标留空间
                                 */}
                                <Input
                                    type="search"
                                    placeholder={field.placeholder || `搜索${field.label}`}
                                    value={values[field.key] || ''}
                                    onChange={e => onChange(field.key, e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                    )
                }

                return null
            })}

            {/* ========== 重置按钮 ========== */}
            {/*
             * ml-auto: margin-left: auto（推到最右边）
             * 条件渲染：只有提供了 onReset 才显示
             */}
            {onReset && (
                <Button variant="outline" size="sm" onClick={onReset} className="ml-auto">
                    重置
                </Button>
            )}
        </div>
    )
}
