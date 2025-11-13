import { useEffect, useRef, useState } from 'react'
import rrwebPlayer from 'rrweb-player'
import 'rrweb-player/dist/style.css'

interface ReplayPlayerProps {
    events: any[]
    width?: number
    height?: number
}

export const ReplayPlayer: React.FC<ReplayPlayerProps> = ({ events, width = 1024, height = 768 }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const playerRef = useRef<any>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!containerRef.current) return
        if (events.length === 0) {
            setError('没有录制的事件')
            return
        }

        try {
            // 清空容器
            if (containerRef.current) {
                containerRef.current.innerHTML = ''
            }

            // 创建新的播放器
            playerRef.current = new rrwebPlayer({
                target: containerRef.current,
                props: {
                    events,
                    width,
                    height,
                    autoPlay: false,
                    showController: true,
                    speedOption: [1, 2, 4, 8],
                    skipInactive: true,
                    showWarning: false,
                },
            })

            setError(null)
        } catch (err) {
            setError(`播放器初始化失败: ${err instanceof Error ? err.message : String(err)}`)
        }

        return () => {
            // rrweb-player 没有 destroy 方法,直接清空容器
            if (containerRef.current) {
                containerRef.current.innerHTML = ''
            }
            playerRef.current = null
        }
    }, [events, width, height])

    if (error) {
        return (
            <div className="border border-red-500 bg-red-50 p-4 rounded">
                <p className="text-red-700 font-semibold">错误</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
        )
    }

    if (events.length === 0) {
        return (
            <div className="border border-gray-300 bg-gray-50 p-8 rounded text-center">
                <p className="text-gray-600">暂无录制数据</p>
                <p className="text-gray-500 text-sm mt-2">触发错误后会自动开始录制</p>
            </div>
        )
    }

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div ref={containerRef} />
        </div>
    )
}
