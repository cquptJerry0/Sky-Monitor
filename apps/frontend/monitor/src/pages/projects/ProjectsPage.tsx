/**
 * 应用列表页
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useApplications, useCreateApplication, useUpdateApplication, useDeleteApplication } from '@/hooks/useApplicationQuery'
import { useAppStore } from '@/stores/app.store'
import { ROUTES } from '@/utils/constants'
import { Plus, Trash2, Loader2, Copy, ExternalLink, Pencil, ShoppingCart, Code, Inbox } from 'lucide-react'
import type { Application, ApplicationType } from '@/api/types'
import { FaReact, FaVuejs } from 'react-icons/fa'
import { SiJavascript } from 'react-icons/si'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { env, getShopDemoUrl } from '@/config/env'

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

    // 创建应用相关状态
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [newAppName, setNewAppName] = useState('')
    const [newAppType, setNewAppType] = useState<ApplicationType>('react')
    const [newAppUrl, setNewAppUrl] = useState('')
    const [useQuickDemo, setUseQuickDemo] = useState(true)

    // 编辑应用相关状态
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editTarget, setEditTarget] = useState<Application | null>(null)
    const [editAppName, setEditAppName] = useState('')
    const [editAppUrl, setEditAppUrl] = useState('')

    // 删除应用相关状态
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Application | null>(null)

    // 获取应用列表 - 已在 hook 中解析为 Application[]
    const { data: applications = [], isLoading, error, refetch } = useApplications()
    const createMutation = useCreateApplication()
    const updateMutation = useUpdateApplication()
    const deleteMutation = useDeleteApplication()

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

        try {
            const appUrl = useQuickDemo ? env.shopDemoUrl : newAppUrl.trim() || undefined

            const result = await createMutation.mutateAsync({
                name: newAppName,
                type: newAppType,
                url: appUrl,
            })

            toast({
                title: '创建成功',
                description: `应用 "${newAppName}" 已创建`,
            })

            setIsCreateDialogOpen(false)
            setNewAppName('')
            setNewAppType('react')
            setNewAppUrl('')
            setUseQuickDemo(true)

            refetch()

            if (useQuickDemo && result?.appId) {
                setTimeout(() => {
                    window.open(getShopDemoUrl(result.appId), '_blank')
                }, 500)
            }
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
        setCurrentAppId(app.appId)

        toast({
            title: '应用已选择',
            description: `当前应用：${app.name}`,
        })

        // 跳转到仪表盘
        navigate(ROUTES.DASHBOARD)
    }

    // 删除应用 - 打开确认对话框
    const handleDeleteClick = (app: Application, e: React.MouseEvent) => {
        e.stopPropagation()
        setDeleteTarget(app)
        setShowDeleteDialog(true)
    }

    // 确认删除应用
    const handleConfirmDelete = async () => {
        if (!deleteTarget) return

        try {
            await deleteMutation.mutateAsync({ appId: deleteTarget.appId })

            toast({
                title: '删除成功',
                description: `应用 "${deleteTarget.name}" 已删除`,
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
        } finally {
            setShowDeleteDialog(false)
            setDeleteTarget(null)
        }
    }

    // 复制 AppId
    const handleCopyAppId = (appId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        navigator.clipboard.writeText(appId)
        toast({
            title: '已复制',
            description: 'AppId 已复制到剪贴板',
        })
    }

    // 编辑应用 - 打开对话框
    const handleEditClick = (app: Application, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditTarget(app)
        setEditAppName(app.name)
        setEditAppUrl(app.url || '')
        setIsEditDialogOpen(true)
    }

    // 确认编辑应用
    const handleConfirmEdit = async () => {
        if (!editTarget) return

        if (!editAppName.trim()) {
            toast({
                title: '错误',
                description: '请输入应用名称',
                variant: 'destructive',
            })
            return
        }

        try {
            await updateMutation.mutateAsync({
                appId: editTarget.appId,
                name: editAppName.trim(),
                url: editAppUrl.trim() || undefined,
            })

            toast({
                title: '更新成功',
                description: `应用 "${editAppName}" 已更新`,
            })

            setIsEditDialogOpen(false)
            setEditTarget(null)
            refetch()
        } catch (error) {
            console.error('[编辑应用] 更新失败', error)
            const errorMessage = error instanceof Error ? error.message : '更新应用失败'
            toast({
                title: '更新失败',
                description: errorMessage,
                variant: 'destructive',
            })
        }
    }

    // 访问应用
    const handleVisitApp = (app: Application, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!app.url) return

        // 判断是否是 shop-demo URL,如果是则携带 appId 参数
        const isShopDemo = app.url.includes(env.shopDemoUrl)
        const finalUrl = isShopDemo ? getShopDemoUrl(app.appId) : app.url

        window.open(finalUrl, '_blank')
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                    <h1 className="text-2xl font-bold text-foreground">应用列表</h1>
                    <p className="mt-1 text-muted-foreground">管理你的监控应用</p>
                </div>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            创建应用
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-foreground">创建新应用</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 mt-4">
                            {/* 应用名称 */}
                            <div className="space-y-2">
                                <Label htmlFor="app-name" className="text-foreground">
                                    应用名称
                                </Label>
                                <Input
                                    id="app-name"
                                    value={newAppName}
                                    onChange={e => setNewAppName(e.target.value)}
                                    placeholder="例如：我的网站"
                                    className="bg-background border-input text-foreground"
                                />
                            </div>

                            {/* 应用类型选择 - 使用卡片 */}
                            <div className="space-y-3">
                                <Label className="text-foreground">应用类型</Label>
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
                                                            ? 'border-primary bg-primary/10'
                                                            : 'border-border bg-secondary hover:border-primary/50'
                                                    }
                                                `}
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <Icon className="h-10 w-10" style={{ color: option.color }} />
                                                    <div className="text-center">
                                                        <div className="text-sm font-semibold text-foreground">{option.label}</div>
                                                        <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* 创建方式选择 */}
                            <div className="space-y-3">
                                <Label className="text-foreground">创建方式</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* 快速演示 */}
                                    <button
                                        type="button"
                                        onClick={() => setUseQuickDemo(true)}
                                        className={`
                                            p-4 rounded-lg border-2 transition-all text-left
                                            ${
                                                useQuickDemo
                                                    ? 'border-orange-500 bg-orange-500/10'
                                                    : 'border-border bg-secondary hover:border-orange-500/50'
                                            }
                                        `}
                                    >
                                        <div className="flex items-start gap-3">
                                            <ShoppingCart
                                                className={`h-5 w-5 mt-0.5 ${useQuickDemo ? 'text-orange-500' : 'text-muted-foreground'}`}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-sm font-semibold text-foreground">快速演示</div>
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    使用官方 Shop Demo 立即体验监控功能
                                                </div>
                                            </div>
                                        </div>
                                    </button>

                                    {/* 标准创建 */}
                                    <button
                                        type="button"
                                        onClick={() => setUseQuickDemo(false)}
                                        className={`
                                            p-4 rounded-lg border-2 transition-all text-left
                                            ${
                                                !useQuickDemo
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-border bg-secondary hover:border-primary/50'
                                            }
                                        `}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Code
                                                className={`h-5 w-5 mt-0.5 ${!useQuickDemo ? 'text-primary' : 'text-muted-foreground'}`}
                                            />
                                            <div className="flex-1">
                                                <div className="text-sm font-semibold text-foreground">标准创建</div>
                                                <div className="text-xs text-muted-foreground mt-1">手动集成 SDK 到您的应用</div>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* 应用 URL - 仅在标准创建时显示 */}
                            {!useQuickDemo && (
                                <div className="space-y-2">
                                    <Label htmlFor="app-url" className="text-foreground">
                                        应用 URL (可选)
                                    </Label>
                                    <Input
                                        id="app-url"
                                        value={newAppUrl}
                                        onChange={e => setNewAppUrl(e.target.value)}
                                        placeholder="https://example.com"
                                        className="bg-background border-input text-foreground"
                                    />
                                    <p className="text-xs text-muted-foreground">填写应用访问地址,方便快速跳转</p>
                                </div>
                            )}

                            {/* 快速演示提示 */}
                            {useQuickDemo && (
                                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                    <div className="flex items-start gap-3">
                                        <ShoppingCart className="h-5 w-5 text-orange-500 mt-0.5" />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-foreground">关于快速演示</div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                创建应用后,将自动打开 Shop Demo 购物车演示应用,您可以立即看到错误监控、性能监控、Session
                                                Replay 等功能的实际效果。
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 创建按钮 */}
                            <Button onClick={handleCreateApp} disabled={createMutation.isPending} className="w-full">
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
                <Card>
                    <CardContent className="py-16">
                        <div className="flex flex-col items-center justify-center text-center">
                            <Inbox className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">还没有应用</h3>
                            <p className="text-muted-foreground mb-6 max-w-md">创建一个应用开始监控你的前端应用性能和错误。</p>
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                创建第应用
                            </Button>
                        </div>
                    </CardContent>
                </Card>
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
                                className="p-6 bg-card border border-border rounded-lg hover:border-primary cursor-pointer transition-colors group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-foreground mb-1">{app.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-muted-foreground">{app.appId}</p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={e => handleCopyAppId(app.appId, e)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                                title="复制 AppId"
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={e => handleDeleteClick(app, e)}
                                        disabled={deleteMutation.isPending}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* 应用 URL */}
                                {app.url && (
                                    <div className="mb-3">
                                        <button
                                            onClick={e => handleVisitApp(app, e)}
                                            className="text-sm text-primary hover:underline flex items-center gap-1"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            {app.url}
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2 py-1 text-xs bg-secondary border border-border rounded text-muted-foreground flex items-center gap-1.5">
                                        <TypeIcon className="h-3.5 w-3.5" style={{ color: typeColor }} />
                                        {typeLabel}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        创建于 {format(new Date(app.createdAt), 'yyyy/MM/dd', { locale: zhCN })}
                                    </span>
                                </div>

                                {/* 操作按钮 */}
                                <div className="flex gap-2 pt-3 border-t border-border">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={e => {
                                            e.stopPropagation()
                                            handleSelectApp(app)
                                        }}
                                        className="flex-1"
                                    >
                                        查看监控
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={e => handleEditClick(app, e)} className="flex-1">
                                        <Pencil className="h-3.5 w-3.5 mr-1" />
                                        编辑应用
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* 编辑应用对话框 */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>编辑应用</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-app-name">应用名称</Label>
                            <Input
                                id="edit-app-name"
                                value={editAppName}
                                onChange={e => setEditAppName(e.target.value)}
                                placeholder="请输入应用名称"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-app-url">应用 URL (可选)</Label>
                            <Input
                                id="edit-app-url"
                                value={editAppUrl}
                                onChange={e => setEditAppUrl(e.target.value)}
                                placeholder="https://example.com"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleConfirmEdit} disabled={updateMutation.isPending}>
                            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            保存
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 删除确认对话框 */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除应用？</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要删除应用 "{deleteTarget?.name}" 吗？此操作无法撤销，所有相关数据将被永久删除。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">
                            确认删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
