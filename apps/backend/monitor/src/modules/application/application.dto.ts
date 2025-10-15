import { z } from 'zod'

/**
 * 创建应用的数据传输对象
 */
export const createApplicationSchema = z
    .object({
        type: z.enum(['vanilla', 'react', 'vue']),
        name: z.string(),
    })
    .required()

export type CreateApplicationDto = z.infer<typeof createApplicationSchema>

/**
 * 删除应用的数据传输对象
 */
export const deleteApplicationSchema = z
    .object({
        appId: z.string(),
    })
    .required()

export type DeleteApplicationDto = z.infer<typeof deleteApplicationSchema>
