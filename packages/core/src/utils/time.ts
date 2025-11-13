/**
 * 获取中国时区的时间戳字符串
 * 格式: YYYY-MM-DD HH:mm:ss
 */
export function getChinaTimestamp(): string {
    const date = new Date()

    // 转换为中国时区 (UTC+8)
    const chinaTime = new Date(date.getTime() + 8 * 60 * 60 * 1000)

    const year = chinaTime.getUTCFullYear()
    const month = String(chinaTime.getUTCMonth() + 1).padStart(2, '0')
    const day = String(chinaTime.getUTCDate()).padStart(2, '0')
    const hours = String(chinaTime.getUTCHours()).padStart(2, '0')
    const minutes = String(chinaTime.getUTCMinutes()).padStart(2, '0')
    const seconds = String(chinaTime.getUTCSeconds()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
