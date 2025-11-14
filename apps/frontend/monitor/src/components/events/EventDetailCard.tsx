import type { Event } from '@/api/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { FieldRenderer } from './FieldRenderer'
import {
    commonFields,
    errorFields,
    httpErrorFields,
    performanceFields,
    resourceErrorFields,
    sessionFields,
    userFields,
    webVitalFields,
    type DetailField,
} from './eventDetailFields'

interface EventDetailCardProps {
    event: Event
}

export function EventDetailCard({ event }: EventDetailCardProps) {
    const getFieldValue = (field: DetailField, event: Event): unknown => {
        if (field.extract) {
            return field.extract(event)
        }
        const keys = field.key.split('.')
        let value: any = event
        for (const key of keys) {
            value = value?.[key]
        }
        return value
    }

    const renderFields = (fields: DetailField[], title: string) => {
        const visibleFields = fields.filter(field => {
            if (field.condition && !field.condition(event)) return false
            const value = getFieldValue(field, event)
            return value !== null && value !== undefined && value !== ''
        })

        if (visibleFields.length === 0) return null

        return (
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">{title}</h3>
                <div className="space-y-3">
                    {visibleFields.map(field => {
                        const value = getFieldValue(field, event)
                        return (
                            <div key={field.key} className="space-y-1">
                                <div className="text-xs font-medium text-muted-foreground">{field.label}</div>
                                <FieldRenderer type={field.type} value={value} />
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>事件详情</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {renderFields(commonFields, '基本信息')}

                {(event.event_type === 'error' || event.event_type === 'unhandledrejection') && (
                    <>
                        <Separator />
                        {event.http && renderFields(httpErrorFields, 'HTTP 错误详情')}
                        {event.resource && renderFields(resourceErrorFields, '资源错误详情')}
                        {!event.http && !event.resource && renderFields(errorFields, '错误详情')}
                    </>
                )}

                {event.event_type === 'performance' && (
                    <>
                        <Separator />
                        {renderFields(performanceFields, '性能详情')}
                    </>
                )}

                {event.event_type === 'webVital' && (
                    <>
                        <Separator />
                        {renderFields(webVitalFields, 'Web Vitals 详情')}
                    </>
                )}

                {event.session_id && (
                    <>
                        <Separator />
                        {renderFields(sessionFields, '会话信息')}
                    </>
                )}

                {event.user_id && (
                    <>
                        <Separator />
                        {renderFields(userFields, '用户信息')}
                    </>
                )}

                {event.device && (
                    <>
                        <Separator />
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">设备信息</h3>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <div className="text-xs font-medium text-muted-foreground">浏览器</div>
                                    <FieldRenderer type="text" value={`${event.device.browser} ${event.device.browserVersion}`} />
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs font-medium text-muted-foreground">操作系统</div>
                                    <FieldRenderer type="text" value={`${event.device.os} ${event.device.osVersion}`} />
                                </div>
                                {event.device.screen && (
                                    <div className="space-y-1">
                                        <div className="text-xs font-medium text-muted-foreground">屏幕分辨率</div>
                                        <FieldRenderer type="text" value={event.device.screen} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {event.tags && Object.keys(event.tags).length > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">标签</h3>
                            <FieldRenderer type="json" value={event.tags} />
                        </div>
                    </>
                )}

                {event.extra && Object.keys(event.extra).length > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">额外信息</h3>
                            <FieldRenderer type="json" value={event.extra} />
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
