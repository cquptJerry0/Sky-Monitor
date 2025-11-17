import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ExecuteQueryResponse } from '@/types/dashboard'

interface TableChartWidgetProps {
    data: ExecuteQueryResponse
}

/**
 * 表格组件
 */
export function TableChartWidget({ data }: TableChartWidgetProps) {
    const firstResult = data.results[0]
    const tableData = firstResult?.data || []

    if (tableData.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>暂无数据</p>
            </div>
        )
    }

    const columns = Object.keys(tableData[0]!)

    return (
        <div className="h-full overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map(column => (
                            <TableHead key={column}>{column}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tableData.map((row, index) => (
                        <TableRow key={index}>
                            {columns.map(column => (
                                <TableCell key={column}>{String(row[column])}</TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
