import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Inbox, Plus } from 'lucide-react'
import { ROUTES } from '@/utils/constants'

interface EmptyAppStateProps {
    title?: string
    description?: string
}

export function EmptyAppState({
    title = '请先选择应用',
    description = '你需要先选择一个应用才能查看数据。请在顶部导航栏选择应用,或创建一个新应用。',
}: EmptyAppStateProps) {
    const navigate = useNavigate()

    return (
        <Card>
            <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center text-center">
                    <Inbox className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{title}</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
                    <Button onClick={() => navigate(ROUTES.APPLICATIONS)}>
                        <Plus className="mr-2 h-4 w-4" />
                        创建应用
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
