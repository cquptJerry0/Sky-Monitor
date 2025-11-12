/**
 * 登录页
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { authAPI } from '@/api'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES } from '@/utils/constants'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()
    const { toast } = useToast()
    const { setAccessToken, setUser } = useAuthStore()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!username || !password) {
            toast({
                title: '错误',
                description: '请输入用户名和密码',
                variant: 'destructive',
            })
            return
        }

        setIsLoading(true)
        console.log('[登录] 步骤 1: 发送登录请求', { username })

        try {
            // 调用登录 API
            const response = await authAPI.login(username, password)
            console.log('[登录] 步骤 2: 收到响应', response)

            // 检查响应格式
            if (!response?.data?.access_token) {
                console.error('[登录] 错误: 响应格式不正确', response)
                throw new Error('登录响应格式错误')
            }

            const { access_token } = response.data
            console.log('[登录] 步骤 3: 获取到 Access Token', access_token.substring(0, 20) + '...')

            // 存储 Token 到 store
            setAccessToken(access_token)
            console.log('[登录] 步骤 4: Token 已存储到 Zustand store')

            // 验证 store 状态
            const storeState = useAuthStore.getState()
            console.log('[登录] 步骤 5: 验证 store 状态', {
                hasToken: !!storeState.accessToken,
                isAuthenticated: storeState.isAuthenticated,
            })

            // 获取用户信息
            console.log('[登录] 步骤 6: 获取用户信息')
            const userResponse = await authAPI.getCurrentUser()
            console.log('[登录] 步骤 7: 用户信息', userResponse)

            if (userResponse?.data) {
                setUser(userResponse.data)
                console.log('[登录] 步骤 8: 用户信息已存储')
            }

            toast({
                title: '登录成功',
                description: `欢迎回来，${userResponse?.data?.username || username}！`,
            })

            console.log('[登录] 步骤 9: 跳转到应用列表页')
            navigate(ROUTES.PROJECTS)
        } catch (error) {
            console.error('[登录] 错误:', error)
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
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
            <div className="w-full max-w-md p-8 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg shadow-lg">
                {/* Logo 和标题 */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Sky Monitor</h1>
                    <p className="text-[var(--text-secondary)]">前端监控平台</p>
                </div>

                {/* 登录表单 */}
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-[var(--text-primary)]">
                            用户名
                        </Label>
                        <Input
                            id="username"
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="请输入用户名"
                            disabled={isLoading}
                            className="bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-[var(--text-primary)]">
                            密码
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="请输入密码"
                            disabled={isLoading}
                            className="bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)]"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white"
                    >
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

                {/* 测试提示 */}
                <div className="mt-6 p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded">
                    <p className="text-xs text-[var(--text-secondary)] mb-2">测试账号：</p>
                    <p className="text-xs text-[var(--text-primary)]">用户名: admin</p>
                    <p className="text-xs text-[var(--text-primary)]">密码: admin123</p>
                </div>
            </div>
        </div>
    )
}
