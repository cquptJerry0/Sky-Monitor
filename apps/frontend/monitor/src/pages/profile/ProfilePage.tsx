/**
 * 个人资料页面
 */

import { useState } from 'react'
import { useAuth, useUpdateEmail, useUpdatePassword, useUpdateAvatar } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { User, Mail, Calendar, Upload, Lock, Eye, EyeOff } from 'lucide-react'
import { format } from 'date-fns'

export default function ProfilePage() {
    const { user } = useAuth()
    const { toast } = useToast()

    const updateEmail = useUpdateEmail()
    const updatePassword = useUpdatePassword()
    const updateAvatar = useUpdateAvatar()

    const [email, setEmail] = useState(user?.email || '')
    const [isEditingEmail, setIsEditingEmail] = useState(false)

    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)

    const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '')
    const [isEditingAvatar, setIsEditingAvatar] = useState(false)

    if (!user) {
        return null
    }

    const handleSaveEmail = async () => {
        try {
            await updateEmail.mutateAsync(email)
            toast({
                title: '修改成功',
                description: '邮箱已更新',
            })
            setIsEditingEmail(false)
        } catch (error) {
            toast({
                title: '修改失败',
                description: error instanceof Error ? error.message : '邮箱修改失败',
                variant: 'destructive',
            })
        }
    }

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast({
                title: '请填写完整',
                description: '请填写所有密码字段',
                variant: 'destructive',
            })
            return
        }

        if (newPassword !== confirmPassword) {
            toast({
                title: '密码不匹配',
                description: '新密码和确认密码不一致',
                variant: 'destructive',
            })
            return
        }

        if (newPassword.length < 6) {
            toast({
                title: '密码太短',
                description: '密码长度至少为6位',
                variant: 'destructive',
            })
            return
        }

        try {
            await updatePassword.mutateAsync({ currentPassword, newPassword })
            toast({
                title: '修改成功',
                description: '密码已更新',
            })
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setIsChangingPassword(false)
        } catch (error) {
            toast({
                title: '修改失败',
                description: error instanceof Error ? error.message : '密码修改失败',
                variant: 'destructive',
            })
        }
    }

    const handleSaveAvatar = async () => {
        try {
            await updateAvatar.mutateAsync(avatarUrl)
            toast({
                title: '修改成功',
                description: '头像已更新',
            })
            setIsEditingAvatar(false)
        } catch (error) {
            toast({
                title: '修改失败',
                description: error instanceof Error ? error.message : '头像修改失败',
                variant: 'destructive',
            })
        }
    }

    const handleUploadAvatar = () => {
        toast({
            title: '功能开发中',
            description: '头像上传功能正在开发中',
        })
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
                        <div className="space-y-3">
                            <Label>头像</Label>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={avatarUrl || user.avatar} alt={user.username} />
                                    <AvatarFallback className="bg-foreground text-background text-2xl">
                                        {user.username?.charAt(0).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-2">
                                    {isEditingAvatar ? (
                                        <>
                                            <Input
                                                placeholder="输入头像URL"
                                                value={avatarUrl}
                                                onChange={e => setAvatarUrl(e.target.value)}
                                            />
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={handleSaveAvatar}>
                                                    保存
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setAvatarUrl(user.avatar || '')
                                                        setIsEditingAvatar(false)
                                                    }}
                                                >
                                                    取消
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => setIsEditingAvatar(true)}>
                                                修改头像URL
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={handleUploadAvatar}>
                                                <Upload className="w-4 h-4 mr-2" />
                                                上传头像
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 用户名 */}
                        <div className="space-y-2">
                            <Label htmlFor="username">
                                <User className="inline-block w-4 h-4 mr-2" />
                                用户名
                            </Label>
                            <Input id="username" value={user.username} disabled />
                            <p className="text-xs text-muted-foreground">用户名不可修改</p>
                        </div>

                        {/* 邮箱 */}
                        <div className="space-y-2">
                            <Label htmlFor="email">
                                <Mail className="inline-block w-4 h-4 mr-2" />
                                邮箱
                            </Label>
                            {isEditingEmail ? (
                                <>
                                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={handleSaveEmail}>
                                            保存
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setEmail(user.email || '')
                                                setIsEditingEmail(false)
                                            }}
                                        >
                                            取消
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex gap-2">
                                        <Input id="email" value={user.email || '未设置'} disabled className="flex-1" />
                                        <Button variant="outline" onClick={() => setIsEditingEmail(true)}>
                                            修改
                                        </Button>
                                    </div>
                                </>
                            )}
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
                        {isChangingPassword ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">
                                        <Lock className="inline-block w-4 h-4 mr-2" />
                                        当前密码
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="current-password"
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={e => setCurrentPassword(e.target.value)}
                                            placeholder="请输入当前密码"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="new-password">新密码</Label>
                                    <div className="relative">
                                        <Input
                                            id="new-password"
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="请输入新密码(至少6位)"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">确认新密码</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirm-password"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="请再次输入新密码"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button onClick={handleChangePassword}>确认修改</Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setCurrentPassword('')
                                            setNewPassword('')
                                            setConfirmPassword('')
                                            setIsChangingPassword(false)
                                        }}
                                    >
                                        取消
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>密码</Label>
                                <div className="flex gap-2">
                                    <Input type="password" value="********" disabled className="flex-1" />
                                    <Button variant="outline" onClick={() => setIsChangingPassword(true)}>
                                        修改密码
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
