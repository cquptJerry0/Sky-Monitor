import { useState } from 'react'
import { ChevronDown, ChevronRight, FileCode } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface StackFrame {
    file: string
    line: number
    column: number
    functionName?: string
    source?: string
}

interface ErrorStackProps {
    stack?: string
    parsedStack?: StackFrame[]
    className?: string
}

export function ErrorStack({ stack, parsedStack, className }: ErrorStackProps) {
    const [expandedFrames, setExpandedFrames] = useState<Set<number>>(new Set([0]))

    const toggleFrame = (index: number) => {
        const newExpanded = new Set(expandedFrames)
        if (newExpanded.has(index)) {
            newExpanded.delete(index)
        } else {
            newExpanded.add(index)
        }
        setExpandedFrames(newExpanded)
    }

    if (!stack && !parsedStack) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="text-sm">错误堆栈</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">暂无堆栈信息</p>
                </CardContent>
            </Card>
        )
    }

    if (parsedStack && parsedStack.length > 0) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <FileCode className="h-4 w-4" />
                        错误堆栈（SourceMap 已解析）
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {parsedStack.map((frame, index) => (
                        <div key={index} className="border rounded-md overflow-hidden">
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-left font-mono text-xs h-auto py-2"
                                onClick={() => toggleFrame(index)}
                            >
                                {expandedFrames.has(index) ? (
                                    <ChevronDown className="h-3 w-3 mr-2 flex-shrink-0" />
                                ) : (
                                    <ChevronRight className="h-3 w-3 mr-2 flex-shrink-0" />
                                )}
                                <span className="flex-1">
                                    {frame.functionName && <span className="text-blue-600">{frame.functionName}</span>}
                                    {frame.functionName && ' '}
                                    <span className="text-muted-foreground">
                                        at {frame.file}:{frame.line}:{frame.column}
                                    </span>
                                </span>
                            </Button>

                            {expandedFrames.has(index) && frame.source && (
                                <div className="bg-muted p-3 font-mono text-xs overflow-x-auto border-t">
                                    <pre className="text-foreground whitespace-pre">{frame.source}</pre>
                                </div>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="text-sm">错误堆栈（原始）</CardTitle>
            </CardHeader>
            <CardContent>
                <pre className={cn('text-xs font-mono whitespace-pre-wrap break-words bg-muted p-3 rounded-md overflow-x-auto')}>
                    {stack}
                </pre>
            </CardContent>
        </Card>
    )
}
