import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

interface Particle {
    x: number
    y: number
    size: number
    speedX: number
    speedY: number
    opacity: number
    update: () => void
    draw: (ctx: CanvasRenderingContext2D) => void
}

interface WorldProps {
    yi?: 'yin' | 'yang'
}

export function World(props: WorldProps) {
    const { yi } = props
    const dustColor = yi === 'yang' ? '255, 255, 255' : '24, 24, 27'
    const className = yi === 'yang' ? 'bg-zinc-900 left-0' : 'bg-muted right-0 -z-[1]'
    const canvasContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!canvasContainerRef.current) return

        const canvasContainer = canvasContainerRef.current
        const canvas = document.createElement('canvas')
        canvasContainer.appendChild(canvas)
        const ctx = canvas.getContext('2d')

        if (!ctx) return

        canvas.width = canvasContainer.clientWidth
        canvas.height = canvasContainer.clientHeight

        let particlesArray: Particle[] = []

        const mouse = {
            x: undefined as number | undefined,
            y: undefined as number | undefined,
        }

        const containerRect = canvasContainer.getBoundingClientRect()

        const moveHandler = (event: MouseEvent) => {
            mouse.x = event.x - containerRect.left
            mouse.y = event.y

            for (let i = 0; i < 5; i++) {
                particlesArray.push(new ParticleClass())
            }
        }

        class ParticleClass implements Particle {
            x: number
            y: number
            size: number
            speedX: number
            speedY: number
            opacity: number

            constructor() {
                this.x = mouse.x ?? 0
                this.y = mouse.y ?? 0
                this.size = Math.random() * 10 + 1
                this.speedX = Math.random() * 3 - 1.5
                this.speedY = Math.random() * 3 - 1.5
                this.opacity = 1
            }

            update() {
                this.x += this.speedX
                this.y += this.speedY
                this.size *= 0.98 // 逐渐变小
                this.opacity -= 0.02 // 逐渐透明
            }

            draw(ctx: CanvasRenderingContext2D) {
                ctx.strokeStyle = `rgba(${dustColor}, ${this.opacity})`
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(this.x, this.y)
                ctx.lineTo(this.x - this.speedX * 10, this.y - this.speedY * 10)
                ctx.stroke()
            }
        }

        const handleParticles = () => {
            particlesArray = particlesArray.filter(particle => {
                particle.update()
                particle.draw(ctx)
                return particle.size > 0.2 && particle.opacity > 0
            })
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            handleParticles()
            requestAnimationFrame(animate)
        }

        const resizeHandler = () => {
            canvas.width = canvasContainer.clientWidth
            canvas.height = canvasContainer.clientHeight
        }

        window.addEventListener('mousemove', moveHandler)
        window.addEventListener('resize', resizeHandler)

        animate()

        return () => {
            window.removeEventListener('mousemove', moveHandler)
            window.removeEventListener('resize', resizeHandler)
            canvasContainer.removeChild(canvas)
        }
    }, [dustColor])

    return <div ref={canvasContainerRef} className={cn('absolute w-1/2 h-screen', className)}></div>
}
