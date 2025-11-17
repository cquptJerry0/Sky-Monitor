/**
 * Dashboard 组件局部类型
 *
 * 说明：
 * - 主要的 Dashboard 类型已迁移到 @/types/dashboard
 * - 这里只保留组件内部使用的局部类型
 * - 如果需要使用 Dashboard 相关类型，请从 @/types 导入
 */

// 重新导出常用类型，方便组件内部使用
export type {
    WidgetType,
    QueryCondition,
    QueryConfig,
    YAxisConfig,
    DisplayConfig,
    LayoutConfig,
    Dashboard,
    DashboardWidget,
    CreateDashboardDto,
    UpdateDashboardDto,
    DeleteDashboardDto,
    CreateWidgetDto,
    UpdateWidgetDto,
    DeleteWidgetDto,
    UpdateWidgetsLayoutDto,
    ExecuteQueryDto,
    QueryResult,
    ExecuteQueryResponse,
} from '@/types'
