import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDate } from 'date-fns'
import { Bell, MoreHorizontal, Plus } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { createAlert, deleteAlert, fetchAlerts, updateAlert, type Alert } from '@/services/alerts'

export function AlertsConfig() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [editingRule, setEditingRule] = useState<Alert | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        type: 'error' as 'error' | 'performance' | 'custom',
        metric: 'error_rate',
        operator: 'gt' as 'gt' | 'lt' | 'eq' | 'gte' | 'lte',
        threshold: 10,
        timeWindow: 300,
    })
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const { data: rulesData, isLoading } = useQuery({
        queryKey: ['alertRules'],
        queryFn: () => fetchAlerts({ status: 'active' }),
    })

    const createMutation = useMutation({
        mutationFn: createAlert,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alertRules'] })
            setIsCreateDialogOpen(false)
            resetForm()
            toast({
                title: '成功',
                description: '告警规则创建成功',
            })
        },
        onError: () => {
            toast({
                title: '错误',
                description: '创建告警规则失败',
                variant: 'destructive',
            })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateAlert(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alertRules'] })
            setEditingRule(null)
            toast({
                title: '成功',
                description: '告警规则更新成功',
            })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: deleteAlert,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alertRules'] })
            toast({
                title: '成功',
                description: '告警规则删除成功',
            })
        },
    })

    const rules = rulesData?.data?.data || []

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'error',
            metric: 'error_rate',
            operator: 'gt',
            threshold: 10,
            timeWindow: 300,
        })
    }

    const handleCreate = () => {
        createMutation.mutate({
            name: formData.name,
            type: formData.type,
            appId: 'default-app',
            conditions: {
                metric: formData.metric,
                operator: formData.operator,
                threshold: formData.threshold,
                timeWindow: formData.timeWindow,
            },
            actions: [
                {
                    type: 'email',
                    config: {},
                },
            ],
        })
    }

    const handleToggleEnabled = (rule: Alert) => {
        const newStatus = rule.status === 'active' ? 'draft' : 'active'
        updateMutation.mutate({
            id: rule.id,
            data: { status: newStatus },
        })
    }

    const handleDelete = (id: string) => {
        if (confirm('确定要删除此告警规则吗？')) {
            deleteMutation.mutate(id)
        }
    }

    const getTypeLabel = (type: string) => {
        const labels = {
            error: '错误',
            performance: '性能',
            custom: '自定义',
        }
        return labels[type as keyof typeof labels] || type
    }

    return (
        <div className="flex-1 flex-col">
            <header className="flex items-center justify-between h-[36px] mb-4">
                <h1 className="flex flex-row items-center text-xl font-semibold">
                    <Bell className="h-6 w-6 mr-2" />
                    告警配置
                </h1>
                <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    新建告警规则
                </Button>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>告警规则</CardTitle>
                    <CardDescription>配置错误率、慢请求等告警规则</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>规则名称</TableHead>
                                <TableHead>类型</TableHead>
                                <TableHead>指标</TableHead>
                                <TableHead>条件</TableHead>
                                <TableHead>状态</TableHead>
                                <TableHead>创建时间</TableHead>
                                <TableHead>操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-4">
                                        加载中...
                                    </TableCell>
                                </TableRow>
                            ) : rules.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-4">
                                        暂无告警规则
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rules.map((rule: Alert) => (
                                    <TableRow key={rule.id}>
                                        <TableCell className="font-medium">{rule.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{getTypeLabel(rule.type)}</Badge>
                                        </TableCell>
                                        <TableCell>{rule.conditions.metric}</TableCell>
                                        <TableCell>
                                            {rule.conditions.operator} {rule.conditions.threshold}
                                        </TableCell>
                                        <TableCell>
                                            <Switch checked={rule.status === 'active'} onCheckedChange={() => handleToggleEnabled(rule)} />
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {formatDate(new Date(rule.createdAt), 'yyyy-MM-dd HH:mm')}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleDelete(rule.id)}>删除</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>创建告警规则</DialogTitle>
                        <DialogDescription>配置新的告警规则以监控应用性能</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">规则名称</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="例如：高错误率告警"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="type">告警类型</Label>
                            <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="error">错误</SelectItem>
                                    <SelectItem value="performance">性能</SelectItem>
                                    <SelectItem value="custom">自定义</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="metric">监控指标</Label>
                            <Select value={formData.metric} onValueChange={value => setFormData({ ...formData, metric: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="error_rate">错误率</SelectItem>
                                    <SelectItem value="response_time">响应时间</SelectItem>
                                    <SelectItem value="request_count">请求数</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="operator">运算符</Label>
                            <Select value={formData.operator} onValueChange={(value: any) => setFormData({ ...formData, operator: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gt">大于</SelectItem>
                                    <SelectItem value="lt">小于</SelectItem>
                                    <SelectItem value="gte">大于等于</SelectItem>
                                    <SelectItem value="lte">小于等于</SelectItem>
                                    <SelectItem value="eq">等于</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="threshold">阈值</Label>
                            <Input
                                id="threshold"
                                type="number"
                                value={formData.threshold}
                                onChange={e => setFormData({ ...formData, threshold: Number(e.target.value) })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="timeWindow">时间窗口（秒）</Label>
                            <Input
                                id="timeWindow"
                                type="number"
                                value={formData.timeWindow}
                                onChange={e => setFormData({ ...formData, timeWindow: Number(e.target.value) })}
                                placeholder="例如：300（5分钟）"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleCreate} disabled={!formData.name || createMutation.isPending}>
                            创建
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
