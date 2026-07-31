'use client'

import { useEffect, useRef } from 'react'

const SELECTOR = 'a, button, [role="button"], [data-cursor-magnetic], input[type="checkbox"]:not(:disabled), label[for]'
const MAGNETIC_DISTANCE = 120
const MAGNETIC_STRENGTH = 0.35
const DOT_SIZE = 8

export default function CustomCursor() {
	const hLineRef = useRef<HTMLDivElement>(null)
	const vLineRef = useRef<HTMLDivElement>(null)
	const dotRef = useRef<HTMLDivElement>(null)
	const labelRef = useRef<HTMLSpanElement>(null)

	useEffect(() => {
		if (window.matchMedia('(max-width: 1023px)').matches) return

		const mouse = { x: -100, y: -100 }
		const rendered = { x: -100, y: -100 }
		let hoverEl: HTMLElement | null = null
		let snap: { x: number; y: number } | null = null
		let raf = 0
		let firstMove = true

		const lerp = (a: number, b: number, t: number) => a + (b - a) * t

		const setDot = (w: number, h: number, hovering: boolean) => {
			const dot = dotRef.current
			if (!dot) return
			dot.style.width = `${w}px`
			dot.style.height = `${h}px`
			dot.style.borderColor = hovering ? 'var(--color-brand)' : 'transparent'
			dot.style.backgroundColor = hovering ? 'rgba(167,139,250,0.08)' : 'var(--color-brand)'
		}

		const setLabel = (text: string) => {
			const label = labelRef.current
			if (!label) return
			label.textContent = text
			label.style.opacity = text ? '1' : '0'
		}

		const filterEl = (el: HTMLElement | null): HTMLElement | null => {
			if (el && el.closest('[data-cursor-no-magnetic]') && !el.hasAttribute('data-cursor-magnetic')) return null
			return el
		}

		const activate = (el: HTMLElement) => {
			const rect = el.getBoundingClientRect()
			snap = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
			setDot(rect.width + 12, rect.height + 12, true)
			setLabel(el.getAttribute('data-cursor-label') || el.getAttribute('aria-label') || '')
		}

		const release = () => {
			snap = null
			setDot(DOT_SIZE, DOT_SIZE, false)
			setLabel('')
		}

		const onMouseMove = (e: MouseEvent) => {
			mouse.x = e.clientX
			mouse.y = e.clientY
			if (firstMove) {
				firstMove = false
				rendered.x = e.clientX
				rendered.y = e.clientY
			}

			const target = e.target as HTMLElement | null
			const el = filterEl((target?.closest?.(SELECTOR) as HTMLElement | null) ?? null)

			if (el !== hoverEl) {
				hoverEl = el
				if (el) activate(el)
				else release()
			}

			if (!hoverEl) {
				let closest: HTMLElement | null = null
				let closestDist = MAGNETIC_DISTANCE
				document.querySelectorAll<HTMLElement>(SELECTOR).forEach(q => {
					if (q.closest('[data-cursor-no-magnetic]') && !q.hasAttribute('data-cursor-magnetic')) return
					const rect = q.getBoundingClientRect()
					const dist = Math.hypot(e.clientX - (rect.left + rect.width / 2), e.clientY - (rect.top + rect.height / 2))
					if (dist < closestDist) {
						closestDist = dist
						closest = q
					}
				})
				if (closest) {
					const rect = closest.getBoundingClientRect()
					const pull = (1 - closestDist / MAGNETIC_DISTANCE) * MAGNETIC_STRENGTH
					mouse.x = lerp(mouse.x, rect.left + rect.width / 2, pull)
					mouse.y = lerp(mouse.y, rect.top + rect.height / 2, pull)
				}
			}
		}

		const tick = () => {
			if (hoverEl) {
				if (!hoverEl.isConnected) {
					// element was removed from the DOM (e.g. route change) — drop the snap
					hoverEl = null
					release()
				} else {
					// follow the live rect every frame: elements move during scroll
					// even when the mouse doesn't. shift `rendered` by the same
					// delta so the box moves 1:1 with the element (no lerp chase
					// lag) — the lerp below then only smooths mouse-driven motion
					const rect = hoverEl.getBoundingClientRect()
					const cx = rect.left + rect.width / 2
					const cy = rect.top + rect.height / 2
					if (snap && (cx !== snap.x || cy !== snap.y)) {
						rendered.x += cx - snap.x
						rendered.y += cy - snap.y
					}
					snap = { x: cx, y: cy }
					setDot(rect.width + 12, rect.height + 12, true)
				}
			}
			const speed = hoverEl ? 0.18 : 0.28
			rendered.x = lerp(rendered.x, snap ? snap.x : mouse.x, speed)
			rendered.y = lerp(rendered.y, snap ? snap.y : mouse.y, speed)
			if (hLineRef.current) hLineRef.current.style.transform = `translateY(${rendered.y}px)`
			if (vLineRef.current) vLineRef.current.style.transform = `translateX(${rendered.x}px)`
			if (dotRef.current) dotRef.current.style.transform = `translate(${rendered.x}px, ${rendered.y}px) translate(-50%, -50%)`
			raf = requestAnimationFrame(tick)
		}

		const onClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement | null
			if (target?.closest('a') && hoverEl) {
				hoverEl = null
				release()
			}
		}

		const onScroll = () => {
			// scrolling moves content under a stationary mouse — re-hit-test, but
			// only act when the hovered element actually changed; re-snapping the
			// same element here caused release/activate size churn every frame
			const hit = document.elementFromPoint(mouse.x, mouse.y) as HTMLElement | null
			const el = filterEl(hit ? (hit.closest(SELECTOR) as HTMLElement | null) : null)
			if (el === hoverEl) return
			hoverEl = el
			if (el) activate(el)
			else release()
		}

		raf = requestAnimationFrame(tick)
		window.addEventListener('mousemove', onMouseMove)
		window.addEventListener('click', onClick)
		window.addEventListener('scroll', onScroll, { passive: true })
		return () => {
			cancelAnimationFrame(raf)
			window.removeEventListener('mousemove', onMouseMove)
			window.removeEventListener('click', onClick)
			window.removeEventListener('scroll', onScroll)
		}
	}, [])

	return (
		<div className='pointer-events-none fixed inset-0 hidden lg:block' style={{ zIndex: 2147483647 }} aria-hidden>
			<div ref={hLineRef} className='absolute top-0 left-0 h-px w-full' style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
			<div ref={vLineRef} className='absolute top-0 left-0 h-full w-px' style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
			<div
				ref={dotRef}
				className='absolute top-0 left-0 flex items-center justify-center border transition-[width,height,background-color,border-color] duration-200'
				style={{ width: DOT_SIZE, height: DOT_SIZE, backgroundColor: 'var(--color-brand)', borderColor: 'transparent' }}
			>
				<span ref={labelRef} className='text-[9px] tracking-[0.2em] whitespace-nowrap opacity-0 transition-opacity duration-200' style={{ color: 'var(--color-brand)' }} />
			</div>
		</div>
	)
}
