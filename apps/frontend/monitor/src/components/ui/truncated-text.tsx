import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface TruncatedTextProps {
    text: string
    maxWidth?: string
    className?: string
    showTooltip?: boolean
}

/**
 * 长文本省略组件,支持 tooltip 显示完整内容
 */
export function TruncatedText({ text, maxWidth = 'max-w-xs', className, showTooltip = true }: TruncatedTextProps) {
    if (!text) {
        return <span className="text-muted-foreground">-</span>
    }

    const content = <span className={cn('truncate block', maxWidth, className)}>{text}</span>

    if (!showTooltip) {
        return content
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent>
                    <p className="max-w-md break-words">{text}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
