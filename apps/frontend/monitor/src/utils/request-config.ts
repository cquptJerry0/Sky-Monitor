/**
 * 请求配置工具
 *
 * 功能：
 * - 提供统一的方式配置请求的 loading 和 toast 行为
 * - 通过自定义 header 与 request.ts 拦截器通信
 *
 * 使用示例：
 * ```typescript
 * // 显示成功 toast
 * request.post('/api/login', data, {
 *   headers: configureRequest({
 *     showSuccessToast: true,
 *     successMessage: '登录成功'
 *   })
 * })
 *
 * // 静默请求（不显示 loading 和 toast）
 * request.get('/api/user', {
 *   headers: configureRequest({
 *     showLoading: false,
 *     showErrorToast: false
 *   })
 * })
 * ```
 */

export interface RequestConfig {
    /**
     * 是否显示全局 loading
     * @default true
     */
    showLoading?: boolean

    /**
     * 是否显示成功 toast
     * @default false
     */
    showSuccessToast?: boolean

    /**
     * 成功时的提示消息
     * @requires showSuccessToast 为 true
     */
    successMessage?: string

    /**
     * 是否显示错误 toast
     * @default true
     */
    showErrorToast?: boolean

    /**
     * 自定义错误消息（暂未实现）
     */
    errorMessage?: string
}

/**
 * 配置请求的 loading 和 toast 行为
 *
 * 工作原理：
 * 1. 将配置转换为自定义 HTTP header
 * 2. request.ts 的拦截器读取这些 header
 * 3. 根据 header 值决定是否显示 loading/toast
 *
 * 注意：
 * - HTTP headers 只支持 ASCII 字符（ISO-8859-1）
 * - 中文消息需要使用 encodeURIComponent 编码
 *
 * @param config 请求配置
 * @returns 包含自定义 header 的对象
 */
export const configureRequest = (config: RequestConfig): Record<string, string> => {
    const headers: Record<string, string> = {}

    // 配置 loading
    if (config.showLoading === false) {
        headers['X-Show-Loading'] = 'false'
    }

    // 配置成功 toast（对中文进行 URL 编码）
    if (config.showSuccessToast && config.successMessage) {
        headers['X-Success-Message'] = encodeURIComponent(config.successMessage)
    }

    // 配置错误 toast
    if (config.showErrorToast === false) {
        headers['X-Show-Error-Toast'] = 'false'
    }

    return headers
}
