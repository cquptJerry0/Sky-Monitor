export { SamplingIntegration } from './integrations/sampling'
export type { SamplingConfig, SamplingMetadata } from './integrations/sampling'

export { DeduplicationIntegration } from './integrations/deduplication'
export type { DeduplicationConfig } from './integrations/deduplication'

export { Integration, isErrorEvent, isPerformanceEvent } from './types'
export type {
    MonitoringEvent,
    MonitoringOptions,
    Breadcrumb,
    User,
    Scope,
    ErrorEvent,
    PerformanceEvent,
    MessageEvent,
    TransactionEvent,
    CustomEvent,
    BaseEvent,
    EventLevel,
    EventType,
} from './types'

export { Transport, BaseTransport, TransportCallbacks } from './transport'

export { Monitoring, getCurrentClient } from './baseClient'

export { EventPipeline } from './pipeline'
export type { Middleware } from './pipeline'

export { captureEvent, captureException, captureMessage } from './captures'

export { ScopeImpl } from './scope'

// 全局便捷函数
export { setUser, setTag, addBreadcrumb, configureScope } from './baseClient'
