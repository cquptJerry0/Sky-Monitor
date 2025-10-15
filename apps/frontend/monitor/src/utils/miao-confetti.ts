import confetti from 'canvas-confetti'

export function snow() {
    const duration = 15 * 1000
    const animationEnd = Date.now() + duration
    let skew = 1

    function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
    }

    ;(function frame() {
        const timeLeft = animationEnd - Date.now()
        const ticks = Math.max(200, 500 * (timeLeft / duration))
        skew = Math.max(0.8, skew - 0.001)

        confetti({
            particleCount: 1,
            startVelocity: 0,
            ticks: ticks,
            origin: {
                x: Math.random(),
                // since particles fall down, skew start toward the top
                y: Math.random() * skew - 0.2,
            },
            colors: ['#ffffff'],
            shapes: ['circle'],
            gravity: randomInRange(0.4, 0.6),
            scalar: randomInRange(0.4, 1),
            drift: randomInRange(-0.4, 0.4),
        })

        if (timeLeft > 0) {
            requestAnimationFrame(frame)
        }
    })()
}

export function schoolPride() {
    const end = Date.now() + 10 * 1000

    const colors = ['#6726CB', '#E27588', '#54117F', '#FFFFFF']

    ;(function frame() {
        confetti({
            particleCount: 4,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors,
        })
        confetti({
            particleCount: 4,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors,
        })

        if (Date.now() < end) {
            requestAnimationFrame(frame)
        }
    })()
}

export function firework() {
    const duration = 15 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
    }

    const interval = window.setInterval(function () {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
            return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)
        // since particles fall down, start a bit higher than random
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        })
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        })
    }, 250)
}

export const miaoConfetti = {
    snow,
    schoolPride,
    firework,
}
