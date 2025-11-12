/**
 * 全局常量定义
 */

// ==================== API 配置 ====================

/**
 * API 基础 URL
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * SSE 基础 URL
 */
export const SSE_BASE_URL = import.meta.env.VITE_SSE_BASE_URL || '/api'

// ==================== 事件类型 ====================

/**
 * 事件类型常量
 */
export const EVENT_TYPES = {
    ERROR: 'error',
    PERFORMANCE: 'performance',
    WEB_VITAL: 'webVital',
    SESSION: 'session',
    HTTP_ERROR: 'httpError',
    RESOURCE_ERROR: 'resourceError',
    MESSAGE: 'message',
    TRANSACTION: 'transaction',
    CUSTOM: 'custom',
} as const

/**
 * 事件类型标签映射
 */
export const EVENT_TYPE_LABELS: Record<string, string> = {
    error: '错误',
    performance: '性能',
    webVital: 'Web Vitals',
    session: '会话',
    httpError: 'HTTP 错误',
    resourceError: '资源错误',
    message: '消息',
    transaction: '事务',
    custom: '自定义',
}

// ==================== TanStack Query 配置 ====================

/**
 * 查询配置
 */
export const QUERY_CONFIG = {
    // 数据保持新鲜的时间（30 秒）
    STALE_TIME: 30_000,

    // 垃圾回收时间（5 分钟）
    GC_TIME: 5 * 60_000,

    // 重试次数
    RETRY: 1,

    // 重试延迟（毫秒）
    RETRY_DELAY: 1000,

    // 自动重新获取间隔（禁用）
    REFETCH_INTERVAL: false,

    // 窗口聚焦时重新获取
    REFETCH_ON_WINDOW_FOCUS: true,

    // 重新连接时重新获取
    REFETCH_ON_RECONNECT: true,
}

/**
 * 实时数据查询配置（更短的 staleTime）
 */
export const REALTIME_QUERY_CONFIG = {
    STALE_TIME: 5_000, // 5 秒
    GC_TIME: 60_000, // 1 分钟
    RETRY: 2,
    REFETCH_INTERVAL: 10_000, // 10 秒自动刷新
}

// ==================== SSE 配置 ====================

/**
 * SSE 重连配置
 */
export const SSE_CONFIG = {
    // 重连延迟（毫秒）
    RETRY_DELAY: 3000,

    // 最大重试次数
    MAX_RETRIES: 5,

    // 心跳间隔（毫秒）
    HEARTBEAT_INTERVAL: 30_000,

    // 连接超时（毫秒）
    CONNECTION_TIMEOUT: 10_000,
}

// ==================== 时间窗口 ====================

/**
 * 时间窗口常量
 */
export const TIME_WINDOWS = {
    HOUR: 'hour',
    DAY: 'day',
    WEEK: 'week',
} as const

/**
 * 时间窗口标签
 */
export const TIME_WINDOW_LABELS: Record<string, string> = {
    hour: '1 小时',
    day: '1 天',
    week: '1 周',
}

/**
 * 时间窗口毫秒数
 */
export const TIME_WINDOW_MS: Record<string, number> = {
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
}

// ==================== 分页配置 ====================

/**
 * 分页配置
 */
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
    MAX_PAGE_SIZE: 100,
}

// ==================== SourceMap 配置 ====================

/**
 * SourceMap 状态
 */
export const SOURCEMAP_STATUS = {
    PARSED: 'parsed',
    PARSING: 'parsing',
    NOT_AVAILABLE: 'not_available',
    FAILED: 'failed',
} as const

/**
 * SourceMap 状态标签
 */
export const SOURCEMAP_STATUS_LABELS: Record<string, string> = {
    parsed: '已解析',
    parsing: '解析中',
    not_available: '不可用',
    failed: '解析失败',
}

/**
 * SourceMap 状态颜色
 */
export const SOURCEMAP_STATUS_COLORS: Record<string, string> = {
    parsed: 'text-green-500',
    parsing: 'text-yellow-500',
    not_available: 'text-gray-500',
    failed: 'text-red-500',
}

// ==================== 告警配置 ====================

/**
 * 告警规则类型
 */
export const ALERT_RULE_TYPES = {
    ERROR_RATE: 'error_rate',
    SLOW_REQUEST: 'slow_request',
    SESSION_ANOMALY: 'session_anomaly',
} as const

/**
 * 告警规则类型标签
 */
export const ALERT_RULE_TYPE_LABELS: Record<string, string> = {
    error_rate: '错误率',
    slow_request: '慢请求',
    session_anomaly: '会话异常',
}

/**
 * 告警严重程度
 */
export const ALERT_SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
} as const

/**
 * 告警严重程度标签
 */
export const ALERT_SEVERITY_LABELS: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '严重',
}

/**
 * 告警严重程度颜色
 */
export const ALERT_SEVERITY_COLORS: Record<string, string> = {
    low: 'text-blue-500',
    medium: 'text-yellow-500',
    high: 'text-orange-500',
    critical: 'text-red-500',
}

// ==================== Web Vitals 配置 ====================

/**
 * Web Vitals 指标名称
 */
export const WEB_VITAL_NAMES = {
    FCP: 'FCP',
    LCP: 'LCP',
    FID: 'FID',
    CLS: 'CLS',
    TTFB: 'TTFB',
    INP: 'INP',
} as const

/**
 * Web Vitals 指标标签
 */
export const WEB_VITAL_LABELS: Record<string, string> = {
    FCP: 'First Contentful Paint',
    LCP: 'Largest Contentful Paint',
    FID: 'First Input Delay',
    CLS: 'Cumulative Layout Shift',
    TTFB: 'Time to First Byte',
    INP: 'Interaction to Next Paint',
}

/**
 * Web Vitals 评级阈值
 */
export const WEB_VITAL_THRESHOLDS: Record<string, { good: number; poor: number }> = {
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 },
}

/**
 * Web Vitals 评级颜色
 */
export const WEB_VITAL_RATING_COLORS: Record<string, string> = {
    good: 'text-green-500',
    'needs-improvement': 'text-yellow-500',
    poor: 'text-red-500',
}

// ==================== 应用类型 ====================

/**
 * 应用类型
 */
export const APPLICATION_TYPES = {
    VANILLA: 'vanilla',
    REACT: 'react',
    VUE: 'vue',
    ANGULAR: 'angular',
    SVELTE: 'svelte',
} as const

/**
 * 应用类型标签
 */
export const APPLICATION_TYPE_LABELS: Record<string, string> = {
    vanilla: 'Vanilla JS',
    react: 'React',
    vue: 'Vue',
    angular: 'Angular',
    svelte: 'Svelte',
}

// ==================== 性能阈值 ====================

/**
 * 性能阈值配置
 */
export const PERFORMANCE_THRESHOLDS = {
    // 慢请求阈值（毫秒）
    SLOW_REQUEST: 3000,

    // 资源加载慢阈值（毫秒）
    SLOW_RESOURCE: 5000,

    // 页面加载慢阈值（毫秒）
    SLOW_PAGE_LOAD: 5000,
}

// ==================== 本地存储 Key ====================

/**
 * 本地存储 Key
 */
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth-storage',
    APP_STATE: 'app-storage',
    UI_STATE: 'ui-storage',
    THEME: 'theme',
    SIDEBAR_COLLAPSED: 'sidebar-collapsed',
    CURRENT_APP_ID: 'current-app-id',
}

// ==================== 路由路径 ====================

/**
 * 路由路径常量
 */
export const ROUTES = {
    LOGIN: '/auth/login',
    PROJECTS: '/projects',
    DASHBOARD: '/dashboard',
    ERRORS: '/errors',
    ERROR_GROUPS: '/errors/groups',
    PERFORMANCE: '/performance',
    WEB_VITALS: '/performance/web-vitals',
    SLOW_REQUESTS: '/performance/slow-requests',
    RESOURCE_TIMING: '/performance/resource-timing',
    HTTP_ERRORS: '/integrations/http-errors',
    RESOURCE_ERRORS: '/integrations/resource-errors',
    SESSIONS: '/sessions',
    SESSION_REPLAY: '/sessions/:sessionId/replay',
    ALERTS: '/alerts',
    ALERT_CONFIG: '/alerts/config',
} as const

// ==================== 图表配置 ====================

/**
 * 图表颜色
 */
export const CHART_COLORS = {
    PRIMARY: '#6a5acd',
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
    INFO: '#3b82f6',
    GRAY: '#6b7280',
}

/**
 * 图表默认配置
 */
export const CHART_CONFIG = {
    HEIGHT: 300,
    ANIMATION_DURATION: 300,
    TOOLTIP_CURSOR: { strokeDasharray: '3 3' },
}
