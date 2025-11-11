import { format } from 'date-fns'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface RealtimeError {
    timestamp: string
    message: string
    level: string
    fingerprint?: string
}

interface RealtimeSectionProps {
    realtimeErrors: RealtimeError[]
    isConnected: boolean
    clearErrors?: () => void
}

export function RealtimeSection({ realtimeErrors, isConnected, clearErrors }: RealtimeSectionProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>实时错误流</CardTitle>
                    <CardDescription>最新发生的错误事件</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    {isConnected && (
                        <Badge variant="outline" className="text-green-500 border-green-500">
                            <span className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                            实时连接
                        </Badge>
                    )}
                    {clearErrors && realtimeErrors.length > 0 && (
                        <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={clearErrors}>
                            清空
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {realtimeErrors.length > 0 ? (
                    <div className="space-y-2 max-h-[400px] overflow-auto">
                        {realtimeErrors.map((error, index) => (
                            <div
                                key={`${error.timestamp}-${index}`}
                                className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                        <p className="text-sm font-medium truncate">{error.message}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span>{format(new Date(error.timestamp), 'HH:mm:ss')}</span>
                                        {error.fingerprint && <span className="font-mono">{error.fingerprint.slice(0, 8)}</span>}
                                    </div>
                                </div>
                                <Badge variant={error.level === 'error' ? 'destructive' : 'secondary'} className="flex-shrink-0 ml-2">
                                    {error.level}
                                </Badge>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <p className="text-lg font-medium mb-1">系统运行正常</p>
                        <p className="text-sm text-muted-foreground">暂无错误事件</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
