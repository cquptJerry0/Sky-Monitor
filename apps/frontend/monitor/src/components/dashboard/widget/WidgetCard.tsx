import { useState } from 'react'
import { Edit2, Trash2, MoreVertical } from 'lucide-react'
import { WidgetPreview } from './WidgetPreview'
import { useExecuteQuery, useDeleteWidget } from '@/hooks/useDashboard'
import { useDashboardStore } from '@/stores/dashboard.store'
import type { DashboardWidget } from '@/types/dashboard'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
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
import { Button } from '@/components/ui/button'

interface WidgetCardProps {
    widget: DashboardWidget
    onEdit?: (widget: DashboardWidget) => void
}

/**
 * Widget 卡片组件
 * 负责执行查询并渲染 Widget
 */
export function WidgetCard({ widget, onEdit }: WidgetCardProps) {
    const { timeRange, selectedAppId } = useDashboardStore()
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const deleteWidget = useDeleteWidget()

    // 执行查询
    const { data, isLoading, error } = useExecuteQuery(
        timeRange.start && timeRange.end
            ? {
                  widgetId: widget.id,
                  timeRange: {
                      start: timeRange.start.toISOString(),
                      end: timeRange.end.toISOString(),
                  },
                  appId: selectedAppId || undefined,
              }
            : null
    )

    const handleDelete = async () => {
        try {
            await deleteWidget.mutateAsync({ id: widget.id })
            setShowDeleteDialog(false)
        } catch (error) {
            console.error('删除 Widget 失败:', error)
        }
    }

    return (
        <>
            <div className="relative flex flex-col rounded-lg border bg-card shadow-sm overflow-hidden h-full">
                <div className="widget-drag-handle cursor-move rounded-t-lg border-b bg-muted/50 px-4 py-2 flex-shrink-0 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{widget.title}</h3>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit?.(widget)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                删除
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="widget-content flex-1 overflow-auto">
                    <WidgetPreview
                        widgetType={widget.widgetType}
                        title={widget.title}
                        data={data}
                        isLoading={isLoading}
                        error={error}
                        showCard={false}
                    />
                </div>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>确定要删除 Widget "{widget.title}" 吗? 此操作无法撤销。</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
