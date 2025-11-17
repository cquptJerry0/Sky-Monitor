import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface EventListSkeletonProps {
    rows?: number
}

export function EventListSkeleton({ rows = 10 }: EventListSkeletonProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>消息</TableHead>
                    <TableHead>用户</TableHead>
                    <TableHead>会话</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {Array.from({ length: rows }).map((_, i) => (
                    <TableRow key={i}>
                        <td className="p-4">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </td>
                        <td className="p-4">
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </td>
                        <td className="p-4">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full max-w-md" />
                                <Skeleton className="h-3 w-3/4" />
                            </div>
                        </td>
                        <td className="p-4">
                            <Skeleton className="h-4 w-32" />
                        </td>
                        <td className="p-4">
                            <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="p-4">
                            <Skeleton className="h-4 w-28" />
                        </td>
                        <td className="p-4 text-center">
                            <Skeleton className="h-4 w-4 mx-auto" />
                        </td>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
