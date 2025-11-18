/**
 * 用户信息生成工具
 */

const FIRST_NAMES = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴']
const LAST_NAMES = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '秀兰']

const EMAIL_DOMAINS = ['gmail.com', 'qq.com', '163.com', 'outlook.com', 'hotmail.com']

function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function generateRandomName(): string {
    return randomItem(FIRST_NAMES) + randomItem(LAST_NAMES)
}

function generateRandomUsername(): string {
    const prefix = ['user', 'demo', 'test', 'guest', 'visitor']
    const num = Math.floor(Math.random() * 10000)
    return `${randomItem(prefix)}_${num}`
}

function generateRandomEmail(username: string): string {
    return `${username}@${randomItem(EMAIL_DOMAINS)}`
}

export interface UserInfo {
    id: string
    username: string
    email: string
    name: string
}

export function generateRandomUser(): UserInfo {
    const username = generateRandomUsername()
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)

    return {
        id: `user-${timestamp}-${random}`,
        username,
        email: generateRandomEmail(username),
        name: generateRandomName(),
    }
}

export function getCurrentUser(): UserInfo {
    const stored = sessionStorage.getItem('sky-monitor-user')
    if (stored) {
        return JSON.parse(stored)
    }

    const user = generateRandomUser()
    sessionStorage.setItem('sky-monitor-user', JSON.stringify(user))
    return user
}
