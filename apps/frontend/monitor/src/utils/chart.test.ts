/**
 * chart.ts 工具函数测试
 */

import { describe, it, expect } from 'vitest'
import { formatLargeNumber, calculateGrowthRate, formatGrowthRate, formatPercentage, formatTooltipValue } from './chart'

describe('formatLargeNumber', () => {
    it('应该正确格式化小于 1000 的数字', () => {
        expect(formatLargeNumber(0)).toBe('0')
        expect(formatLargeNumber(1)).toBe('1')
        expect(formatLargeNumber(999)).toBe('999')
    })

    it('应该正确格式化 K 级别的数字', () => {
        expect(formatLargeNumber(1000)).toBe('1.0K')
        expect(formatLargeNumber(1500)).toBe('1.5K')
        expect(formatLargeNumber(999999)).toBe('1000.0K')
    })

    it('应该正确格式化 M 级别的数字', () => {
        expect(formatLargeNumber(1000000)).toBe('1.0M')
        expect(formatLargeNumber(1500000)).toBe('1.5M')
        expect(formatLargeNumber(999999999)).toBe('1000.0M')
    })

    it('应该正确格式化 B 级别的数字', () => {
        expect(formatLargeNumber(1000000000)).toBe('1.0B')
        expect(formatLargeNumber(1500000000)).toBe('1.5B')
    })

    it('应该正确处理负数', () => {
        expect(formatLargeNumber(-1000)).toBe('-1.0K')
        expect(formatLargeNumber(-1500000)).toBe('-1.5M')
    })

    it('应该安全处理 null 和 undefined', () => {
        expect(formatLargeNumber(null)).toBe('0')
        expect(formatLargeNumber(undefined)).toBe('0')
    })

    it('应该安全处理 NaN', () => {
        expect(formatLargeNumber(NaN)).toBe('0')
    })
})

describe('calculateGrowthRate', () => {
    it('应该正确计算增长率', () => {
        expect(calculateGrowthRate(150, 100)).toBe(50)
        expect(calculateGrowthRate(50, 100)).toBe(-50)
    })

    it('应该处理除以零的情况', () => {
        expect(calculateGrowthRate(100, 0)).toBe(100)
        expect(calculateGrowthRate(0, 0)).toBe(0)
    })

    it('应该安全处理 null 和 undefined', () => {
        expect(calculateGrowthRate(null, 100)).toBe(-100)
        expect(calculateGrowthRate(100, null)).toBe(100)
        expect(calculateGrowthRate(null, null)).toBe(0)
        expect(calculateGrowthRate(undefined, undefined)).toBe(0)
    })
})

describe('formatGrowthRate', () => {
    it('应该正确格式化正增长率', () => {
        expect(formatGrowthRate(15.5)).toBe('+15.5%')
        expect(formatGrowthRate(100)).toBe('+100.0%')
    })

    it('应该正确格式化负增长率', () => {
        expect(formatGrowthRate(-15.5)).toBe('-15.5%')
        expect(formatGrowthRate(-100)).toBe('-100.0%')
    })

    it('应该正确格式化零增长率', () => {
        expect(formatGrowthRate(0)).toBe('+0.0%')
    })

    it('应该安全处理 null 和 undefined', () => {
        expect(formatGrowthRate(null)).toBe('+0.0%')
        expect(formatGrowthRate(undefined)).toBe('+0.0%')
    })
})

describe('formatPercentage', () => {
    it('应该正确格式化百分比', () => {
        expect(formatPercentage(50, 100)).toBe('50.0%')
        expect(formatPercentage(33, 100)).toBe('33.0%')
    })

    it('应该处理除以零的情况', () => {
        expect(formatPercentage(50, 0)).toBe('0%')
    })

    it('应该支持自定义小数位数', () => {
        expect(formatPercentage(33.333, 100, 2)).toBe('33.33%')
        expect(formatPercentage(33.333, 100, 0)).toBe('33%')
    })

    it('应该安全处理 null 和 undefined', () => {
        expect(formatPercentage(null, 100)).toBe('0.0%')
        expect(formatPercentage(50, null)).toBe('0%')
        expect(formatPercentage(null, null)).toBe('0%')
        expect(formatPercentage(undefined, undefined)).toBe('0%')
    })
})

describe('formatTooltipValue', () => {
    it('应该正确格式化 count 类型', () => {
        expect(formatTooltipValue(1500, 'count')).toBe('1.5K')
        expect(formatTooltipValue(1000000, 'count')).toBe('1.0M')
    })

    it('应该正确格式化 duration 类型', () => {
        expect(formatTooltipValue(123.456, 'duration')).toBe('123.46ms')
    })

    it('应该正确格式化 percentage 类型', () => {
        expect(formatTooltipValue(45.678, 'percentage')).toBe('45.7%')
    })

    it('应该安全处理 null 和 undefined', () => {
        expect(formatTooltipValue(null, 'count')).toBe('0')
        expect(formatTooltipValue(undefined, 'duration')).toBe('0.00ms')
        expect(formatTooltipValue(null, 'percentage')).toBe('0.0%')
    })
})
