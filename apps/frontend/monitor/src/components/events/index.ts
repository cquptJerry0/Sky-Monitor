/**
 * Events 组件统一导出
 */

// 详情相关
export { EventDetailCard } from './detail/EventDetailCard'
export { FieldRenderer } from './detail/FieldRenderer'
export { BreadcrumbTimeline } from './detail/BreadcrumbTimeline'

// 列表相关
export { EventListRow } from './list/EventListRow'
export { EventListSkeleton } from './list/EventListSkeleton'
export { EventFilters } from './list/EventFilters'
export type { EventFiltersState } from './list/EventFilters'

// 统计相关
export { EventStats } from './stats/EventStats'

// Schema 相关
export { extractEventMessage } from './schemas/eventDisplaySchema'
export type { EventMessage } from './schemas/eventDisplaySchema'
export type { FieldType, DetailField } from './schemas/eventFieldSchema'
export {
    commonFields,
    errorFields,
    httpErrorFields,
    performanceFields,
    resourceErrorFields,
    sessionFields,
    userFields,
    webVitalFields,
    deviceFields,
    networkFields,
    frameworkFields,
    metadataFields,
} from './schemas/eventFieldSchema'
