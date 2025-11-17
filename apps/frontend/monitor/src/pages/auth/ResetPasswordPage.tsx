/**
 * 重置密码页面
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { authAPI } from '@/api'
import { ROUTES } from '@/utils/constants'
import { Loader2, Eye, EyeOff, Lock } from 'lucide-react'

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { toast } = useToast()

    const [token, setToken] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({})

    useEffect(() => {
        const tokenParam = searchParams.get('token')
        if (!tokenParam) {
            toast({
                title: '无效的链接',
                description: '重置密码链接无效或已过期',
                variant: 'destructive',
            })
            navigate(ROUTES.LOGIN)
        } else {
            setToken(tokenParam)
        }
    }, [searchParams, navigate, toast])

    const validateForm = (): boolean => {
        const newErrors: { newPassword?: string; confirmPassword?: string } = {}

        if (!newPassword) {
            newErrors.newPassword = '请输入新密码'
        } else if (newPassword.length < 6) {
            newErrors.newPassword = '密码长度至少6位'
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = '请确认新密码'
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = '两次输入的密码不一致'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setIsLoading(true)

        try {
            await authAPI.resetPassword(token, newPassword)

            toast({
                title: '密码重置成功',
                description: '请使用新密码登录',
            })

            navigate(ROUTES.LOGIN)
        } catch (error) {
            toast({
                title: '重置失败',
                description: error instanceof Error ? error.message : '请稍后重试',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">重置密码</h1>
                    <p className="text-muted-foreground">请输入您的新密码</p>
                </div>

                <div className="bg-card border border-border rounded-lg shadow-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 新密码 */}
                        <div className="space-y-2">
                            <Label htmlFor="newPassword" className="text-foreground">
                                新密码
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="newPassword"
                                    type={showNewPassword ? 'text' : 'password'}
                                    placeholder="请输入新密码"
                                    value={newPassword}
                                    onChange={e => {
                                        setNewPassword(e.target.value)
                                        setErrors({ ...errors, newPassword: undefined })
                                    }}
                                    className={`pl-10 pr-10 bg-card border-border text-foreground ${errors.newPassword ? 'border-destructive' : ''}`}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword}</p>}
                        </div>

                        {/* 确认密码 */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-foreground">
                                确认密码
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="请再次输入新密码"
                                    value={confirmPassword}
                                    onChange={e => {
                                        setConfirmPassword(e.target.value)
                                        setErrors({ ...errors, confirmPassword: undefined })
                                    }}
                                    className={`pl-10 pr-10 bg-card border-border text-foreground ${errors.confirmPassword ? 'border-destructive' : ''}`}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                        </div>

                        {/* 提交按钮 */}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    重置中...
                                </>
                            ) : (
                                '重置密码'
                            )}
                        </Button>

                        {/* 返回登录 */}
                        <div className="text-center">
                            <button type="button" onClick={() => navigate(ROUTES.LOGIN)} className="text-sm text-primary hover:underline">
                                返回登录
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
