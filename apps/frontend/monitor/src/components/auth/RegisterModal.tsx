/**
 * 注册弹窗
 */

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { authAPI } from '@/api'
import { Loader2, Eye, EyeOff } from 'lucide-react'

interface RegisterModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function RegisterModal({ open, onOpenChange, onSuccess }: RegisterModalProps) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<{
        username?: string
        password?: string
        confirmPassword?: string
        email?: string
        phone?: string
    }>({})
    const { toast } = useToast()

    // 表单验证
    const validateForm = (): boolean => {
        const newErrors: typeof errors = {}

        // 用户名验证
        if (!username) {
            newErrors.username = '请输入用户名'
        } else if (username.length < 3 || username.length > 20) {
            newErrors.username = '用户名长度为 3-20 个字符'
        }

        // 密码验证
        if (!password) {
            newErrors.password = '请输入密码'
        } else if (password.length < 6 || password.length > 50) {
            newErrors.password = '密码长度为 6-50 个字符'
        }

        // 确认密码验证
        if (!confirmPassword) {
            newErrors.confirmPassword = '请确认密码'
        } else if (confirmPassword !== password) {
            newErrors.confirmPassword = '两次密码输入不一致'
        }

        // 邮箱验证 (可选)
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = '邮箱格式不正确'
        }

        // 手机号验证 (可选)
        if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
            newErrors.phone = '手机号格式不正确'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()

        // 表单验证
        if (!validateForm()) {
            return
        }

        setIsLoading(true)

        try {
            await authAPI.register({
                username,
                password,
                email: email || undefined,
                phone: phone || undefined,
            })

            toast({
                title: '注册成功',
                description: '请使用新账号登录',
            })

            // 重置表单
            setUsername('')
            setPassword('')
            setConfirmPassword('')
            setEmail('')
            setPhone('')
            setErrors({})

            // 关闭弹窗
            onOpenChange(false)

            // 调用成功回调
            onSuccess?.()
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '注册失败,请稍后重试'
            toast({
                title: '注册失败',
                description: errorMessage,
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[var(--bg-tertiary)] border-[var(--border-primary)] max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-[var(--text-primary)]">注册新账号</DialogTitle>
                    <DialogDescription className="text-[var(--text-secondary)]">填写以下信息创建您的账号</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleRegister} className="space-y-4 mt-4">
                    {/* 用户名 */}
                    <div className="space-y-2">
                        <Label htmlFor="register-username" className="text-[var(--text-primary)]">
                            用户名 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="register-username"
                            type="text"
                            value={username}
                            onChange={e => {
                                setUsername(e.target.value)
                                if (errors.username) {
                                    setErrors({ ...errors, username: undefined })
                                }
                            }}
                            placeholder="请输入用户名"
                            disabled={isLoading}
                            className={`bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)] ${errors.username ? 'border-red-500' : ''}`}
                        />
                        {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
                    </div>

                    {/* 密码 */}
                    <div className="space-y-2">
                        <Label htmlFor="register-password" className="text-[var(--text-primary)]">
                            密码 <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="register-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => {
                                    setPassword(e.target.value)
                                    if (errors.password) {
                                        setErrors({ ...errors, password: undefined })
                                    }
                                }}
                                placeholder="请输入密码"
                                disabled={isLoading}
                                className={`bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)] pr-10 ${errors.password ? 'border-red-500' : ''}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                    </div>

                    {/* 确认密码 */}
                    <div className="space-y-2">
                        <Label htmlFor="register-confirm-password" className="text-[var(--text-primary)]">
                            确认密码 <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="register-confirm-password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={e => {
                                    setConfirmPassword(e.target.value)
                                    if (errors.confirmPassword) {
                                        setErrors({ ...errors, confirmPassword: undefined })
                                    }
                                }}
                                placeholder="请再次输入密码"
                                disabled={isLoading}
                                className={`bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)] pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                    </div>

                    {/* 邮箱 (可选) */}
                    <div className="space-y-2">
                        <Label htmlFor="register-email" className="text-[var(--text-primary)]">
                            邮箱
                        </Label>
                        <Input
                            id="register-email"
                            type="email"
                            value={email}
                            onChange={e => {
                                setEmail(e.target.value)
                                if (errors.email) {
                                    setErrors({ ...errors, email: undefined })
                                }
                            }}
                            placeholder="请输入邮箱 (可选)"
                            disabled={isLoading}
                            className={`bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)] ${errors.email ? 'border-red-500' : ''}`}
                        />
                        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                    </div>

                    {/* 手机号 (可选) */}
                    <div className="space-y-2">
                        <Label htmlFor="register-phone" className="text-[var(--text-primary)]">
                            手机号
                        </Label>
                        <Input
                            id="register-phone"
                            type="tel"
                            value={phone}
                            onChange={e => {
                                setPhone(e.target.value)
                                if (errors.phone) {
                                    setErrors({ ...errors, phone: undefined })
                                }
                            }}
                            placeholder="请输入手机号 (可选)"
                            disabled={isLoading}
                            className={`bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)] ${errors.phone ? 'border-red-500' : ''}`}
                        />
                        {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                    </div>

                    {/* 提交按钮 */}
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="flex-1">
                            取消
                        </Button>
                        <Button type="submit" disabled={isLoading} className="flex-1">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    注册中...
                                </>
                            ) : (
                                '注册'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
