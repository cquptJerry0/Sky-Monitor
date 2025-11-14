/**
 * 忘记密码弹窗组件
 */

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Mail } from 'lucide-react'

interface ForgotPasswordModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<{ email?: string }>({})
    const { toast } = useToast()

    const validateForm = (): boolean => {
        const newErrors: { email?: string } = {}

        if (!email) {
            newErrors.email = '请输入邮箱地址'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = '请输入有效的邮箱地址'
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
            // TODO: 调用忘记密码 API
            // await authAPI.forgotPassword({ email })

            // 模拟 API 调用
            await new Promise(resolve => setTimeout(resolve, 1000))

            toast({
                title: '重置邮件已发送',
                description: '请检查您的邮箱并按照说明重置密码',
            })

            onOpenChange(false)
            setEmail('')
            setErrors({})
        } catch (error) {
            toast({
                title: '发送失败',
                description: error instanceof Error ? error.message : '请稍后重试',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-popover border-border max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-foreground">忘记密码</DialogTitle>
                    <DialogDescription className="text-muted-foreground">输入您的邮箱地址，我们将发送密码重置链接</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="forgot-email" className="text-foreground">
                            邮箱地址
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="forgot-email"
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={e => {
                                    setEmail(e.target.value)
                                    setErrors({ ...errors, email: undefined })
                                }}
                                className={`pl-10 bg-card border-border text-foreground ${errors.email ? 'border-destructive' : ''}`}
                                disabled={isLoading}
                            />
                        </div>
                        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>

                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="flex-1">
                            取消
                        </Button>
                        <Button type="submit" disabled={isLoading} className="flex-1">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    发送中...
                                </>
                            ) : (
                                '发送重置邮件'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
