import { z } from 'zod'

/**
 * 创建应用的数据传输对象
 */
export const createApplicationSchema = z
    .object({
        type: z.enum(['vanilla', 'react', 'vue']),
        name: z.string(),
        url: z.string().url({ message: '请输入有效的 URL 地址' }).optional().or(z.literal('')),
    })
    .required()

export type CreateApplicationDto = z.infer<typeof createApplicationSchema>

/**
 * 更新应用的数据传输对象
 */
export const updateApplicationSchema = z
    .object({
        appId: z.string(),
        name: z.string().optional(),
        url: z.string().url({ message: '请输入有效的 URL 地址' }).optional().or(z.literal('')),
        description: z.string().optional(),
    })
    .required()

export type UpdateApplicationDto = z.infer<typeof updateApplicationSchema>

/**
 * 删除应用的数据传输对象
 */
export const deleteApplicationSchema = z
    .object({
        appId: z.string(),
    })
    .required()

export type DeleteApplicationDto = z.infer<typeof deleteApplicationSchema>
