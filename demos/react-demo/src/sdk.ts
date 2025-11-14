/**
 * Sky Monitor SDK 工具函数
 * 提供 SDK 客户端访问和常用 API
 */
import { addBreadcrumb, setUser, setTag, captureEvent, captureException, captureMessage } from '@sky-monitor/monitor-sdk-browser'

let monitoringClient: any = null

export function setSDKClient(client: any) {
    monitoringClient = client
}

export function getSDKClient() {
    return monitoringClient
}

export { addBreadcrumb, setUser, setTag, captureEvent, captureException, captureMessage }
