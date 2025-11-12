/**
 * 应用列表页
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useApplications, useCreateApplication, useDeleteApplication } from '@/hooks/useApplicationQuery'
import { useAppStore } from '@/stores/app.store'
import { ROUTES } from '@/utils/constants'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import type { Application, ApplicationType } from '@/api/types'
import { FaReact, FaVuejs } from 'react-icons/fa'
import { SiJavascript } from 'react-icons/si'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// 应用类型配置
const APP_TYPE_OPTIONS: Array<{
    value: ApplicationType
    label: string
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
    color: string
    description: string
}> = [
    {
        value: 'react',
        label: 'React',
        icon: FaReact,
        color: '#61DAFB',
        description: 'React 应用',
    },
    {
        value: 'vue',
        label: 'Vue',
        icon: FaVuejs,
        color: '#42B883',
        description: 'Vue.js 应用',
    },
    {
        value: 'vanilla',
        label: 'Vanilla JS',
        icon: SiJavascript,
        color: '#F7DF1E',
        description: '原生 JavaScript',
    },
]

export default function ProjectsPage() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const { setCurrentAppId } = useAppStore()
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [newAppName, setNewAppName] = useState('')
    const [newAppType, setNewAppType] = useState<ApplicationType>('react')

    // 获取应用列表 - 已在 hook 中解析为 Application[]
    const { data: applications = [], isLoading, error, refetch } = useApplications()
    const createMutation = useCreateApplication()
    const deleteMutation = useDeleteApplication()

    console.log('[应用列表] 应用数据:', applications)
    console.log('[应用列表] 应用数量:', applications.length)
    console.log('[应用列表] 加载状态:', isLoading)
    console.log('[应用列表] 错误:', error)

    // 创建应用
    const handleCreateApp = async () => {
        if (!newAppName.trim()) {
            toast({
                title: '错误',
                description: '请输入应用名称',
                variant: 'destructive',
            })
            return
        }

        console.log('[创建应用] 开始创建', { name: newAppName, type: newAppType })

        try {
            const result = await createMutation.mutateAsync({
                name: newAppName,
                type: newAppType,
            })

            console.log('[创建应用] 创建成功', result)

            toast({
                title: '创建成功',
                description: `应用 "${newAppName}" 已创建`,
            })

            setIsCreateDialogOpen(false)
            setNewAppName('')
            setNewAppType('react')
            refetch()
        } catch (error) {
            console.error('[创建应用] 创建失败', error)
            const errorMessage = error instanceof Error ? error.message : '创建应用失败'
            toast({
                title: '创建失败',
                description: errorMessage,
                variant: 'destructive',
            })
        }
    }

    // 选择应用
    const handleSelectApp = (app: Application) => {
        console.log('[选择应用] 选择应用', app)
        setCurrentAppId(app.appId)

        toast({
            title: '应用已选择',
            description: `当前应用：${app.name}`,
        })

        // 跳转到仪表盘
        navigate(ROUTES.DASHBOARD)
    }

    // 删除应用
    const handleDeleteApp = async (app: Application, e: React.MouseEvent) => {
        e.stopPropagation()

        if (!confirm(`确定要删除应用 "${app.name}" 吗？`)) {
            return
        }

        console.log('[删除应用] 开始删除', app)

        try {
            await deleteMutation.mutateAsync({ appId: app.appId })

            console.log('[删除应用] 删除成功')

            toast({
                title: '删除成功',
                description: `应用 "${app.name}" 已删除`,
            })

            refetch()
        } catch (error) {
            console.error('[删除应用] 删除失败', error)
            const errorMessage = error instanceof Error ? error.message : '删除应用失败'
            toast({
                title: '删除失败',
                description: errorMessage,
                variant: 'destructive',
            })
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
            </div>
        )
    }

    if (error) {
        const errorMessage = error instanceof Error ? error.message : '加载失败'
        return (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400">加载失败: {errorMessage}</p>
            </div>
        )
    }

    return (
        <div>
            {/* 页面标题和创建按钮 */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">应用列表</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">管理你的监控应用</p>
                </div>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]">
                            <Plus className="h-4 w-4 mr-2" />
                            创建应用
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[var(--bg-tertiary)] border-[var(--border-primary)] max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-[var(--text-primary)]">创建新应用</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 mt-4">
                            {/* 应用名称 */}
                            <div className="space-y-2">
                                <Label htmlFor="app-name" className="text-[var(--text-primary)]">
                                    应用名称
                                </Label>
                                <Input
                                    id="app-name"
                                    value={newAppName}
                                    onChange={e => setNewAppName(e.target.value)}
                                    placeholder="例如：我的网站"
                                    className="bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)]"
                                />
                            </div>

                            {/* 应用类型选择 - 使用卡片 */}
                            <div className="space-y-3">
                                <Label className="text-[var(--text-primary)]">应用类型</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    {APP_TYPE_OPTIONS.map(option => {
                                        const Icon = option.icon
                                        const isSelected = newAppType === option.value
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setNewAppType(option.value)}
                                                className={`
                                                    p-4 rounded-lg border-2 transition-all
                                                    ${
                                                        isSelected
                                                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                                                            : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--color-primary)]/50'
                                                    }
                                                `}
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <Icon className="h-10 w-10" style={{ color: option.color }} />
                                                    <div className="text-center">
                                                        <div className="text-sm font-semibold text-[var(--text-primary)]">
                                                            {option.label}
                                                        </div>
                                                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                                                            {option.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* 创建按钮 */}
                            <Button
                                onClick={handleCreateApp}
                                disabled={createMutation.isPending}
                                className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
                            >
                                {createMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        创建中...
                                    </>
                                ) : (
                                    '创建'
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* 应用列表 */}
            {applications.length === 0 ? (
                <div className="text-center py-12 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
                    <p className="text-[var(--text-secondary)] mb-4">还没有应用，创建一个开始监控吧</p>
                    <Button
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        创建第一个应用
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {applications.map(app => {
                        // 查找对应的类型配置
                        const typeConfig = APP_TYPE_OPTIONS.find(opt => opt.value === app.type)
                        const TypeIcon = typeConfig?.icon || SiJavascript
                        const typeLabel = typeConfig?.label || app.type
                        const typeColor = typeConfig?.color || '#F7DF1E'

                        return (
                            <div
                                key={app.id}
                                onClick={() => handleSelectApp(app)}
                                className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg hover:border-[var(--color-primary)] cursor-pointer transition-colors group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{app.name}</h3>
                                        <p className="text-sm text-[var(--text-secondary)]">{app.appId}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={e => handleDeleteApp(app, e)}
                                        disabled={deleteMutation.isPending}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 text-xs bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded text-[var(--text-secondary)] flex items-center gap-1.5">
                                        <TypeIcon className="h-3.5 w-3.5" style={{ color: typeColor }} />
                                        {typeLabel}
                                    </span>
                                    <span className="text-xs text-[var(--text-secondary)]">
                                        创建于 {format(new Date(app.createdAt), 'yyyy/MM/dd', { locale: zhCN })}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
