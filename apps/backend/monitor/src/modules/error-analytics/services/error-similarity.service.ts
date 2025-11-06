import { Injectable } from '@nestjs/common'
import { distance } from 'fastest-levenshtein'

/**
 * 错误相似度计算服务
 *
 * @description
 * 使用 Levenshtein 距离算法计算两个错误消息之间的相似度。
 * 主要用于智能错误聚合，将相似的错误归为同一问题组。
 *
 * 核心功能：
 * 1. 归一化错误消息（移除动态内容：数字、URL、时间戳等）
 * 2. 计算 Levenshtein 距离（编辑距离）
 * 3. 转换为相似度分数（0-1）
 * 4. 支持自定义相似度阈值
 *
 * 应用场景：
 * - 减少重复错误告警
 * - 智能分组相似错误
 * - 识别错误模式和趋势
 */
@Injectable()
export class ErrorSimilarityService {
    /**
     * 计算两个错误消息的相似度
     *
     * @description
     * 算法步骤：
     * 1. 归一化两个错误消息（移除动态内容）
     * 2. 计算 Levenshtein 距离（最小编辑操作次数）
     * 3. 转换为相似度：similarity = 1 - (distance / maxLength)
     *
     * 相似度范围：
     * - 1.0: 完全相同
     * - 0.8-1.0: 非常相似（通常可归为同一问题）
     * - 0.5-0.8: 有一定相似性
     * - 0.0-0.5: 差异较大
     *
     * @example
     * ```typescript
     * const similarity = service.calculateSimilarity(
     *   'TypeError: Cannot read property "name" of undefined',
     *   'TypeError: Cannot read property "age" of undefined'
     * )
     * // similarity ≈ 0.85
     * ```
     *
     * @param msg1 - 第一个错误消息
     * @param msg2 - 第二个错误消息
     * @returns 相似度分数（0-1）
     */
    calculateSimilarity(msg1: string, msg2: string): number {
        if (!msg1 || !msg2) {
            return 0
        }

        // 归一化：移除动态内容（数字、URL、时间戳等）
        const normalized1 = this.normalize(msg1)
        const normalized2 = this.normalize(msg2)

        // 特殊情况：归一化后完全相同
        if (normalized1 === normalized2) {
            return 1.0
        }

        // 计算 Levenshtein 距离（编辑距离）
        const dist = distance(normalized1, normalized2)
        const maxLen = Math.max(normalized1.length, normalized2.length)

        // 转换为相似度分数
        // similarity = 1 - (编辑距离 / 最大长度)
        return maxLen === 0 ? 1 : 1 - dist / maxLen
    }

    /**
     * 判断两个错误是否相似（基于阈值）
     *
     * @description
     * 推荐阈值：
     * - 0.9: 非常严格，只有几乎完全相同的错误才会被归为一组
     * - 0.8: 推荐值，能较好平衡误报和漏报
     * - 0.7: 宽松，会将更多错误归为一组
     *
     * @param msg1 - 第一个错误消息
     * @param msg2 - 第二个错误消息
     * @param threshold - 相似度阈值，默认 0.8
     * @returns 是否相似
     */
    isSimilar(msg1: string, msg2: string, threshold = 0.8): boolean {
        const similarity = this.calculateSimilarity(msg1, msg2)
        return similarity >= threshold
    }

    /**
     * 归一化错误消息
     *
     * @description
     * 归一化策略：
     * 1. 数字替换为 'N'（如：line 123 -> line N）
     * 2. URL 替换为 'URL'
     * 3. 日期替换为 'DATE'（如：2024-01-01 -> DATE）
     * 4. 时间戳替换为 'TIMESTAMP'
     * 5. UUID 替换为 'UUID'
     * 6. 移除引号
     * 7. 合并多个空格为单个空格
     * 8. 转为小写
     * 9. 去除首尾空格
     *
     * @example
     * ```typescript
     * normalize('Error at line 123 in file.js')
     * // => 'error at line n in file.js'
     *
     * normalize('Failed to fetch https://api.example.com/users')
     * // => 'failed to fetch url'
     * ```
     *
     * @param message - 原始错误消息
     * @returns 归一化后的消息
     */
    private normalize(message: string): string {
        return (
            message
                // 数字 -> N
                .replace(/\d+/g, 'N')
                // URL -> URL (http/https)
                .replace(/https?:\/\/\S+/g, 'URL')
                // 日期 -> DATE (YYYY-MM-DD)
                .replace(/\d{4}-\d{2}-\d{2}/g, 'DATE')
                // 时间戳 -> TIMESTAMP (13位或10位)
                .replace(/\b\d{10,13}\b/g, 'TIMESTAMP')
                // UUID -> UUID (8-4-4-4-12)
                .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, 'UUID')
                // 十六进制哈希 -> HASH (如 webpack chunk hash)
                .replace(/\b[0-9a-f]{8,}\b/gi, 'HASH')
                // 移除引号
                .replace(/['"]/g, '')
                // 合并空格
                .replace(/\s+/g, ' ')
                // 转小写
                .toLowerCase()
                // 去除首尾空格
                .trim()
        )
    }

    /**
     * 批量计算相似度矩阵
     *
     * @description
     * 计算一组错误消息两两之间的相似度。
     * 用于找出一组错误中最相似的子集。
     *
     * 时间复杂度：O(n²)，其中 n 是消息数量
     * 注意：当消息数量较大时（>1000），建议分批处理或使用其他优化策略
     *
     * @param messages - 错误消息数组
     * @returns 相似度矩阵（二维数组）
     */
    calculateSimilarityMatrix(messages: string[]): number[][] {
        const n = messages.length
        const matrix: number[][] = Array(n)
            .fill(0)
            .map(() => Array(n).fill(0))

        for (let i = 0; i < n; i++) {
            for (let j = i; j < n; j++) {
                if (i === j) {
                    matrix[i][j] = 1.0 // 自己和自己的相似度为 1
                } else {
                    const similarity = this.calculateSimilarity(messages[i], messages[j])
                    matrix[i][j] = similarity
                    matrix[j][i] = similarity // 矩阵对称
                }
            }
        }

        return matrix
    }

    /**
     * 找出与目标消息最相似的消息
     *
     * @description
     * 从候选消息列表中找出与目标消息最相似的一条。
     * 用于将新错误归入已有的错误组。
     *
     * @param target - 目标错误消息
     * @param candidates - 候选消息数组
     * @param threshold - 最小相似度阈值，默认 0.8
     * @returns 最相似的消息及其索引，若无满足阈值的则返回 null
     */
    findMostSimilar(target: string, candidates: string[], threshold = 0.8): { message: string; index: number; similarity: number } | null {
        let maxSimilarity = 0
        let maxIndex = -1

        for (let i = 0; i < candidates.length; i++) {
            const similarity = this.calculateSimilarity(target, candidates[i])
            if (similarity > maxSimilarity) {
                maxSimilarity = similarity
                maxIndex = i
            }
        }

        // 如果最大相似度超过阈值，返回结果
        if (maxSimilarity >= threshold && maxIndex >= 0) {
            return {
                message: candidates[maxIndex],
                index: maxIndex,
                similarity: maxSimilarity,
            }
        }

        return null
    }
}
