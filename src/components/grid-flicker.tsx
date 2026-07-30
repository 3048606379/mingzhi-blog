'use client'

import { useEffect, useRef } from 'react'

const CELL = 60
const MAX_CELLS = 14

export default function GridFlicker() {
	const ref = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const canvas = ref.current
		if (!canvas) return
		const ctx = canvas.getContext('2d')
		if (!ctx) return

		let raf = 0
		let cells: { x: number; y: number; t: number; dur: number }[] = []

		const resize = () => {
			canvas.width = window.innerWidth
			canvas.height = window.innerHeight
		}
		resize()
		window.addEventListener('resize', resize)

		const spawn = () => {
			const cols = Math.ceil(canvas.width / CELL)
			const rows = Math.ceil(canvas.height / CELL)
			cells.push({
				x: Math.floor(Math.random() * cols),
				y: Math.floor(Math.random() * rows),
				t: performance.now(),
				dur: 900 + Math.random() * 900
			})
		}

		const spawnTimer = setInterval(() => {
			if (cells.length < MAX_CELLS) spawn()
			if (Math.random() < 0.4) spawn()
		}, 220)

		const tick = (now: number) => {
			ctx.clearRect(0, 0, canvas.width, canvas.height)
			cells = cells.filter(c => now - c.t < c.dur)
			for (const c of cells) {
				const p = (now - c.t) / c.dur
				const alpha = Math.sin(p * Math.PI) * 0.12
				ctx.fillStyle = `rgba(167,139,250,${alpha})`
				ctx.fillRect(c.x * CELL + 1, c.y * CELL + 1, CELL - 2, CELL - 2)
			}
			raf = requestAnimationFrame(tick)
		}
		raf = requestAnimationFrame(tick)

		return () => {
			cancelAnimationFrame(raf)
			clearInterval(spawnTimer)
			window.removeEventListener('resize', resize)
		}
	}, [])

	return <canvas ref={ref} className='pointer-events-none fixed inset-0 z-0' aria-hidden />
}
