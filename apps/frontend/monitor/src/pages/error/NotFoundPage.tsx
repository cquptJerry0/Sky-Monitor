/**
 * 404 页面
 */

import { useNavigate, useRouteError } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
    const navigate = useNavigate()
    const error = useRouteError()

    console.error('Route error:', error)

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <span className="text-4xl font-bold text-muted-foreground">404</span>
                    </div>
                    <CardTitle className="text-2xl">页面不存在</CardTitle>
                    <CardDescription>抱歉,您访问的页面不存在或已被删除</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <Button onClick={() => navigate(-1)} variant="outline" className="w-full">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            返回上一页
                        </Button>
                        <Button onClick={() => navigate('/projects')} className="w-full">
                            <Home className="mr-2 h-4 w-4" />
                            返回首页
                        </Button>
                    </div>

                    {process.env.NODE_ENV === 'development' && error && (
                        <details className="text-sm mt-4">
                            <summary className="cursor-pointer font-medium text-muted-foreground">错误详情</summary>
                            <pre className="mt-2 bg-muted p-3 rounded-md overflow-auto text-xs">{JSON.stringify(error, null, 2)}</pre>
                        </details>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
