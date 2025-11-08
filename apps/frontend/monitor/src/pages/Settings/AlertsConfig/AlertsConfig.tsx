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
import { createAlertRule, deleteAlertRule, fetchAlertRules, updateAlertRule, type AlertRule } from '@/services/alerts'

export function AlertsConfig() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [editingRule, setEditingRule] = useState<AlertRule | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        type: 'error_rate' as 'error_rate' | 'slow_request' | 'session_anomaly',
        threshold: 10,
        window: '5m',
        enabled: true,
    })
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const { data: rulesData, isLoading } = useQuery({
        queryKey: ['alertRules'],
        queryFn: () => fetchAlertRules(),
    })

    const createMutation = useMutation({
        mutationFn: createAlertRule,
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
        mutationFn: ({ id, data }: { id: string; data: any }) => updateAlertRule(id, data),
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
        mutationFn: deleteAlertRule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alertRules'] })
            toast({
                title: '成功',
                description: '告警规则删除成功',
            })
        },
    })

    const rules = rulesData?.data || []

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'error_rate',
            threshold: 10,
            window: '5m',
            enabled: true,
        })
    }

    const handleCreate = () => {
        createMutation.mutate({
            app_id: 'default-app',
            ...formData,
        })
    }

    const handleToggleEnabled = (rule: AlertRule) => {
        updateMutation.mutate({
            id: rule.id,
            data: { enabled: !rule.enabled },
        })
    }

    const handleDelete = (id: string) => {
        if (confirm('确定要删除此告警规则吗？')) {
            deleteMutation.mutate(id)
        }
    }

    const getTypeLabel = (type: string) => {
        const labels = {
            error_rate: '错误率',
            slow_request: '慢请求',
            session_anomaly: '会话异常',
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
                                <TableHead>阈值</TableHead>
                                <TableHead>时间窗口</TableHead>
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
                                rules.map((rule: AlertRule) => (
                                    <TableRow key={rule.id}>
                                        <TableCell className="font-medium">{rule.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{getTypeLabel(rule.type)}</Badge>
                                        </TableCell>
                                        <TableCell>{rule.threshold}</TableCell>
                                        <TableCell>{rule.window}</TableCell>
                                        <TableCell>
                                            <Switch checked={rule.enabled} onCheckedChange={() => handleToggleEnabled(rule)} />
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {formatDate(new Date(rule.created_at), 'yyyy-MM-dd HH:mm')}
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
                                    <SelectItem value="error_rate">错误率</SelectItem>
                                    <SelectItem value="slow_request">慢请求</SelectItem>
                                    <SelectItem value="session_anomaly">会话异常</SelectItem>
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
                            <Label htmlFor="window">时间窗口</Label>
                            <Select value={formData.window} onValueChange={value => setFormData({ ...formData, window: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1m">1分钟</SelectItem>
                                    <SelectItem value="5m">5分钟</SelectItem>
                                    <SelectItem value="15m">15分钟</SelectItem>
                                    <SelectItem value="1h">1小时</SelectItem>
                                </SelectContent>
                            </Select>
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
