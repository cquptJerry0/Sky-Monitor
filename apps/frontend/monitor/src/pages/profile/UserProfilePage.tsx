/**
 * 用户资料页面
 */

import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Calendar, Shield } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default function UserProfilePage() {
    const { user } = useAuth()

    if (!user) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">未登录</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">用户资料</h1>
                <p className="text-muted-foreground mt-1">查看和管理您的账户信息</p>
            </div>

            {/* 基本信息 */}
            <Card>
                <CardHeader>
                    <CardTitle>基本信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <div className="text-xl font-bold">{user.username}</div>
                            <div className="text-sm text-muted-foreground">用户名</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">邮箱</div>
                                <div className="text-base">{user.email || '-'}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">用户 ID</div>
                                <div className="text-base font-mono text-sm">{user.id}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">创建时间</div>
                                <div className="text-base">
                                    {user.createdAt ? format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN }) : '-'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">更新时间</div>
                                <div className="text-base">
                                    {user.updatedAt ? format(new Date(user.updatedAt), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN }) : '-'}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 账户状态 */}
            <Card>
                <CardHeader>
                    <CardTitle>账户状态</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">活跃</Badge>
                        <span className="text-sm text-muted-foreground">您的账户状态正常</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
