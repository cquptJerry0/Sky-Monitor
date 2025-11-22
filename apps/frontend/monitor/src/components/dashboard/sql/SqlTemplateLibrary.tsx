import { Code, Copy, Check } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCurrentAppId } from '@/hooks/useCurrentApp'

interface SqlTemplateLibraryProps {
    onSelectTemplate: (sql: string) => void
}

export function SqlTemplateLibrary({ onSelectTemplate }: SqlTemplateLibraryProps) {
    const currentAppId = useCurrentAppId()
    const [copied, setCopied] = useState(false)

    // 自动填充当前appId的SQL模版
    const sqlTemplate = `SELECT *
FROM monitor_events
WHERE app_id = '${currentAppId || '{app_id}'}'
ORDER BY timestamp DESC
LIMIT 10`

    const handleCopy = () => {
        navigator.clipboard.writeText(sqlTemplate)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Card className="hover:bg-accent/50 transition-colors">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            基础查询模版
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">查询最近10条事件记录</CardDescription>
                    </div>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 w-8 p-0">
                            {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onSelectTemplate(sqlTemplate)} className="h-8">
                            使用
                        </Button>
                    </div>
                </div>
            </CardHeader>
        </Card>
    )
}
