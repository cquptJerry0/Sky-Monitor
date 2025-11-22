/**
 * 登录页
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { authAPI } from '@/api'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES } from '@/utils/constants'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { RegisterModal } from '@/components/auth/RegisterModal'
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal'

const REMEMBER_ME_KEY = 'sky-monitor-remember-username'

export default function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [errors, setErrors] = useState<{ username?: string; password?: string }>({})
    const [showRegisterModal, setShowRegisterModal] = useState(false)
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
    const navigate = useNavigate()
    const { toast } = useToast()
    const { setAccessToken, setUser } = useAuthStore()

    // 页面加载时,从 localStorage 读取用户名
    useEffect(() => {
        const savedUsername = localStorage.getItem(REMEMBER_ME_KEY)
        if (savedUsername) {
            setUsername(savedUsername)
            setRememberMe(true)
        }
    }, [])

    // 表单验证
    const validateForm = (): boolean => {
        const newErrors: { username?: string; password?: string } = {}

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

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()

        // 表单验证
        if (!validateForm()) {
            return
        }

        setIsLoading(true)

        try {
            // 调用登录 API
            const response = await authAPI.login(username, password)

            // 检查响应格式
            if (!response?.access_token) {
                throw new Error('登录响应格式错误')
            }

            const { access_token } = response

            // 存储 Token 到 store
            setAccessToken(access_token)

            // 获取用户信息
            const userResponse = await authAPI.getCurrentUser()

            if (userResponse) {
                setUser(userResponse)
            }

            // 处理"记住我"功能
            if (rememberMe) {
                localStorage.setItem(REMEMBER_ME_KEY, username)
            } else {
                localStorage.removeItem(REMEMBER_ME_KEY)
            }

            toast({
                title: '登录成功',
                description: `欢迎回来，${userResponse?.username || username}！`,
            })

            navigate(ROUTES.PROJECTS)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '用户名或密码错误'
            toast({
                title: '登录失败',
                description: errorMessage,
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-full max-w-md p-8 bg-card border border-border rounded-lg shadow-lg">
                {/* Logo 和标题 */}
                <div className="text-center mb-8">
                    <div className="flex justify-center items-center gap-3 mb-2">
                        <img src="/logo.svg" alt="Sky Monitor" className="h-12 w-12" />
                        <h1 className="text-3xl font-bold text-foreground">Sky Monitor</h1>
                    </div>
                    <p className="text-muted-foreground">前端监控平台</p>
                </div>

                {/* 登录表单 */}
                <form onSubmit={handleLogin} className="space-y-6">
                    {/* 用户名 */}
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-foreground">
                            用户名
                        </Label>
                        <Input
                            id="username"
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
                            className={`bg-card border-border text-foreground ${errors.username ? 'border-destructive' : ''}`}
                        />
                        {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
                    </div>

                    {/* 密码 */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-foreground">
                                密码
                            </Label>
                            <button
                                type="button"
                                onClick={() => setShowForgotPasswordModal(true)}
                                className="text-xs text-primary hover:underline"
                            >
                                忘记密码?
                            </button>
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
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
                                className={`bg-card border-border text-foreground pr-10 ${errors.password ? 'border-destructive' : ''}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                    </div>

                    {/* 记住我 */}
                    <div className="flex items-center space-x-2">
                        <Checkbox id="remember" checked={rememberMe} onCheckedChange={checked => setRememberMe(checked === true)} />
                        <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                            记住我
                        </Label>
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                登录中...
                            </>
                        ) : (
                            '登录'
                        )}
                    </Button>
                </form>

                {/* 注册链接 */}
                <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        还没有账号?{' '}
                        <button type="button" onClick={() => setShowRegisterModal(true)} className="text-primary hover:underline">
                            立即注册
                        </button>
                    </p>
                </div>

                {/* 测试提示 (仅开发环境) */}
                {import.meta.env.MODE === 'development' && (
                    <div className="mt-6 p-4 bg-secondary border border-border rounded">
                        <p className="text-xs text-muted-foreground mb-2">测试账号:</p>
                        <p className="text-xs text-foreground">用户名: admin</p>
                        <p className="text-xs text-foreground">密码: admin123</p>
                    </div>
                )}
            </div>

            {/* 注册弹窗 */}
            <RegisterModal open={showRegisterModal} onOpenChange={setShowRegisterModal} />

            {/* 忘记密码弹窗 */}
            <ForgotPasswordModal open={showForgotPasswordModal} onOpenChange={setShowForgotPasswordModal} />
        </div>
    )
}
