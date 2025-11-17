/**
 * API 统一导出
 */

export { client, getErrorMessage } from './client'
export { authAPI } from './endpoints/auth'
export { eventsAPI } from './endpoints/events'
export { sessionsAPI } from './endpoints/sessions'
export { errorsAPI } from './endpoints/errors'
export { applicationsAPI } from './endpoints/applications'
export { alertsAPI } from './endpoints/alerts'
export { sourcemapsAPI } from './endpoints/sourcemaps'
export { replaysAPI } from './endpoints/replays'
export { dashboardApi } from './dashboard'
export { widgetTemplateApi } from './widget-template'
export * from './types'
