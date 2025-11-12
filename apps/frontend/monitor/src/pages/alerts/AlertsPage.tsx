/**
 * 告警规则列表页
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentApp } from '@/hooks/useCurrentApp'
import { useAlertRules, useCreateAlertRule, useUpdateAlertRule, useDeleteAlertRule } from '@/hooks/useAlertQuery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PAGINATION } from '@/utils/constants'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { RefreshCw, Plus, Edit, Trash2, History } from 'lucide-react'
import type { AlertRule } from '@/api/types'

export default function AlertsPage() {
    const navigate = useNavigate()
    const { currentApp } = useCurrentApp()
    const [page, setPage] = useState(0)
    const [pageSize] = useState(PAGINATION.DEFAULT_PAGE_SIZE)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingRule, setEditingRule] = useState<AlertRule | null>(null)

    // 表单状态
    const [formData, setFormData] = useState<{
        name: string
        type: 'error_rate' | 'slow_request' | 'session_anomaly'
        threshold: number
        window: string
        enabled: boolean
    }>({
        name: '',
        type: 'error_rate',
        threshold: 10,
        window: 'hour',
        enabled: true,
    })

    // 查询告警规则
    const {
        data: rules,
        isLoading,
        refetch,
    } = useAlertRules({
        appId: currentApp?.appId || '',
    })

    const createMutation = useCreateAlertRule()
    const updateMutation = useUpdateAlertRule()
    const deleteMutation = useDeleteAlertRule()

    const handleCreate = () => {
        setEditingRule(null)
        setFormData({
            name: '',
            type: 'error_rate',
            threshold: 10,
            window: 'hour',
            enabled: true,
        })
        setIsDialogOpen(true)
    }

    const handleEdit = (rule: AlertRule) => {
        setEditingRule(rule)
        setFormData({
            name: rule.name,
            type: rule.type,
            threshold: rule.threshold,
            window: rule.window,
            enabled: rule.enabled,
        })
        setIsDialogOpen(true)
    }

    const handleDelete = async (ruleId: string) => {
        if (!confirm('确定要删除这条告警规则吗？')) return
        await deleteMutation.mutateAsync(ruleId)
        refetch()
    }

    const handleSubmit = async () => {
        if (!currentApp) return

        const payload = {
            app_id: currentApp.appId,
            name: formData.name,
            type: formData.type,
            threshold: formData.threshold,
            window: formData.window,
            enabled: formData.enabled,
        }

        if (editingRule) {
            await updateMutation.mutateAsync({ id: editingRule.id, data: payload })
        } else {
            await createMutation.mutateAsync(payload)
        }

        setIsDialogOpen(false)
        refetch()
    }

    const getStatusBadge = (enabled: boolean) => {
        return enabled ? <Badge variant="default">启用</Badge> : <Badge variant="outline">禁用</Badge>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">告警规则</h1>
                    <p className="text-muted-foreground mt-1">管理告警规则和触发条件</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        刷新
                    </Button>
                    <Button size="sm" onClick={handleCreate}>
                        <Plus className="h-4 w-4 mr-2" />
                        创建规则
                    </Button>
                </div>
            </div>

            {/* 告警规则列表 */}
            <Card>
                <CardHeader>
                    <CardTitle>告警规则列表（共 {rules?.length || 0} 条）</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">加载中...</div>
                    ) : !rules || rules.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">暂无告警规则</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>规则名称</TableHead>
                                    <TableHead>条件</TableHead>
                                    <TableHead>阈值</TableHead>
                                    <TableHead>时间窗口</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead>创建时间</TableHead>
                                    <TableHead>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rules.map(rule => (
                                    <TableRow key={rule.id}>
                                        <TableCell className="font-medium">{rule.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{rule.type}</Badge>
                                        </TableCell>
                                        <TableCell>{rule.threshold}</TableCell>
                                        <TableCell>{rule.window}</TableCell>
                                        <TableCell>{getStatusBadge(rule.enabled)}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {rule.created_at
                                                ? format(new Date(rule.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })
                                                : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => navigate(`/alerts/${rule.id}/history`)}>
                                                    <History className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleEdit(rule)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* 创建/编辑对话框 */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingRule ? '编辑告警规则' : '创建告警规则'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">规则名称</label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="输入规则名称..."
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">告警类型</label>
                            <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="error_rate">错误率</SelectItem>
                                    <SelectItem value="slow_request">慢请求</SelectItem>
                                    <SelectItem value="session_anomaly">会话异常</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">阈值</label>
                            <Input
                                type="number"
                                value={formData.threshold}
                                onChange={e => setFormData({ ...formData, threshold: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">时间窗口</label>
                            <Select value={formData.window} onValueChange={v => setFormData({ ...formData, window: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hour">1 小时</SelectItem>
                                    <SelectItem value="day">1 天</SelectItem>
                                    <SelectItem value="week">1 周</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleSubmit}>{editingRule ? '更新' : '创建'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
