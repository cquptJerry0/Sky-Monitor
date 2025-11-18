/**
 * 获取当前时间戳 (Unix 毫秒时间戳)
 *
 * 注意: 统一使用 Unix 时间戳,避免时区问题
 * 后端会将其转换为 UTC 时间存储,前端会根据用户本地时区显示
 */
export function getChinaTimestamp(): number {
    return Date.now()
}
