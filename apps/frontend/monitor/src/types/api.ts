/**
 * 用户相关
 */
export interface CreateUserPayload {
    username: string
    password: string
}

export interface LoginPayload {
    username: string
    password: string
}

export interface LoginRes {
    data: {
        access_token: string
    }
}

export interface CurrentUserRes {
    data: {
        username: string
        email: string
    }
}

/**
 * 应用相关
 */
export type ApplicationType = 'vanilla' | 'react' | 'vue'

export interface ApplicationData {
    type: ApplicationType
    appId: string
    name: string
    bugs: number
    transactions: number
    data: {
        date: string
        resting: number
    }[]
    createdAt: Date
}

/**
 * 应用列表
 */
export interface ApplicationListRes {
    data: { applications: ApplicationData[] }
}

/**
 * 创建应用
 */
export interface CreateApplicationPayload {
    name: string
    type: ApplicationType
}

/**
 * 监控事件相关
 */
export interface MonitorEvent {
    id: string
    app_id: string
    event_type: string
    event_name: string
    event_data: string
    path: string
    user_agent: string
    timestamp: string
    created_at: string
}

export interface EventsListRes {
    data: {
        data: MonitorEvent[]
        total: number
        limit: number
        offset: number
    }
}

export interface EventStatsRes {
    data: {
        eventTypeCounts: Array<{ event_type: string; count: number }>
        errorTrend: Array<{ hour: string; count: number }>
        webVitals: Array<{ event_name: string; avg_value: number; p75_value: number; p95_value: number }>
    }
}
