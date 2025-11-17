/**
 * 个人资料页面
 */

import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { User, Mail, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export default function ProfilePage() {
    const { user } = useAuth()

    if (!user) {
        return null
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">个人资料</h1>
                <p className="text-muted-foreground mt-2">查看和管理您的个人信息</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* 基本信息卡片 */}
                <Card>
                    <CardHeader>
                        <CardTitle>基本信息</CardTitle>
                        <CardDescription>您的账户基本信息</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* 头像 */}
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={user.avatar} alt={user.username} />
                                <AvatarFallback className="bg-foreground text-background text-2xl">
                                    {user.username?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-medium">头像</p>
                                <p className="text-xs text-muted-foreground">暂不支持修改头像</p>
                            </div>
                        </div>

                        {/* 用户名 */}
                        <div className="space-y-2">
                            <Label htmlFor="username">
                                <User className="inline-block w-4 h-4 mr-2" />
                                用户名
                            </Label>
                            <Input id="username" value={user.username} disabled />
                        </div>

                        {/* 邮箱 */}
                        <div className="space-y-2">
                            <Label htmlFor="email">
                                <Mail className="inline-block w-4 h-4 mr-2" />
                                邮箱
                            </Label>
                            <Input id="email" value={user.email || '未设置'} disabled />
                        </div>

                        {/* 创建时间 */}
                        {user.created_at && (
                            <div className="space-y-2">
                                <Label htmlFor="created_at">
                                    <Calendar className="inline-block w-4 h-4 mr-2" />
                                    注册时间
                                </Label>
                                <Input id="created_at" value={format(new Date(user.created_at), 'yyyy-MM-dd HH:mm:ss')} disabled />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 账户安全卡片 */}
                <Card>
                    <CardHeader>
                        <CardTitle>账户安全</CardTitle>
                        <CardDescription>管理您的账户安全设置</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>密码</Label>
                            <div className="flex gap-2">
                                <Input type="password" value="********" disabled />
                                <Button variant="outline" disabled>
                                    修改密码
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">暂不支持修改密码</p>
                        </div>

                        <div className="space-y-2">
                            <Label>角色</Label>
                            <Input value={user.role === 'admin' ? '管理员' : '普通用户'} disabled />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
