'use client'

import { useEffect, useRef, useState } from 'react'

const SELECTOR = 'a, button, [role="button"], [data-cursor-magnetic], input[type="checkbox"]:not(:disabled), label[for]'
const MAGNETIC_DISTANCE = 120
const MAGNETIC_STRENGTH = 0.35
const DOT_SIZE = 8

/**
 * 命中检测统一走「真实指针坐标」。
 *
 * 之前的实现把磁吸偏移直接写回 `mouse`，于是 elementFromPoint 拿到的是被吸附过的
 * 坐标 —— 在 share 这类多行紧贴的列表里，滚动重算时会命中错误的行（或漏空），
 * 指针框便在两行之间反复跳变、被拉伸成畸形。
 *
 * 现在分三层坐标：
 *   pointer  真实指针位置，命中检测唯一依据（mousemove 更新）
 *   magnet   磁吸位移后的位置，仅用于渲染 / 磁力计算
 *   rendered 实际渲染位置（向目标插值）
 */
export default function CustomCursor() {
	const hLineRef = useRef<HTMLDivElement>(null)
	const vLineRef = useRef<HTMLDivElement>(null)
	const dotRef = useRef<HTMLDivElement>(null)
	const labelRef = useRef<HTMLSpanElement>(null)
	// the pinned hoverable as a data attribute: inspectable, and cheap to assert on
	const [pinnedKey, setPinnedKey] = useState('')

	useEffect(() => {
		if (window.matchMedia('(max-width: 1023px)').matches) return

		// --- real pointer: never mutated by the magnet -------------------------
		const pointer = { x: -100, y: -100, valid: false }
		// --- what the dot chases: pulled toward the nearest hoverable ----------
		const magnet = { x: -100, y: -100 }
		const rendered = { x: -100, y: -100 }
		let pinned: HTMLElement | null = null
		// the element currently carrying [data-cursor-hover]. tracked on its own (not
		// derived from `pinned`) so clearing it can never be skipped by an early
		// return in refreshHover — a stale marker leaves the row's arrow stuck on.
		let marked: HTMLElement | null = null
		let raf = 0
		// centre of the pinned element as of the last frame — both the render target
		// (so the box follows the row) and the reference for the delta shift that
		// makes scrolling track 1:1
		let snap: { x: number; y: number } | null = null
		// a fresh pin (and every release) should glide from the current position.
		// once the glide is done the box is re-centred directly on the element, so
		// scrolling tracks it 1:1 instead of chasing it with lerp lag.
		let pinStarted = true
		let dotW = DOT_SIZE
		let dotH = DOT_SIZE
		let firstMove = true

		const lerp = (a: number, b: number, t: number) => a + (b - a) * t

		const setDot = (w: number, h: number, hovering: boolean) => {
			const dot = dotRef.current
			if (!dot) return
			if (w !== dotW) {
				dot.style.width = `${w}px`
				dotW = w
			}
			if (h !== dotH) {
				dot.style.height = `${h}px`
				dotH = h
			}
			dot.style.borderColor = hovering ? 'var(--color-brand)' : 'transparent'
			dot.style.backgroundColor = hovering ? 'rgba(167,139,250,0.08)' : 'var(--color-brand)'
		}

		const setLabel = (text: string) => {
			const label = labelRef.current
			if (!label || label.textContent === text) return
			label.textContent = text
			label.style.opacity = text ? '1' : '0'
		}

		const filterEl = (el: HTMLElement | null): HTMLElement | null => {
			if (el && el.closest('[data-cursor-no-magnetic]') && !el.hasAttribute('data-cursor-magnetic')) return null
			return el
		}

		/** the hoverable under the real pointer — the one and only hit source */
		const hitTest = (): HTMLElement | null => {
			// elementFromPoint throws on points outside the viewport
			if (pointer.x < 0 || pointer.y < 0 || pointer.x > window.innerWidth || pointer.y > window.innerHeight) return null
			const under = document.elementFromPoint(pointer.x, pointer.y) as HTMLElement | null
			return filterEl((under?.closest?.(SELECTOR) as HTMLElement | null) ?? null)
		}

		const activate = (el: HTMLElement) => {
			const rect = el.getBoundingClientRect()
			snap = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
			// a fresh pin must glide from wherever the dot is now, not jump
			pinStarted = true
			// the browser only re-evaluates :hover on mouse input, so while the wheel
			// scrolls rows under a still pointer the row's own hover effects (the
			// arrow, the title highlight) would stay stuck on the previous row.
			// mirror the pinned state onto the element so CSS keeps them in lockstep.
			if (marked !== el) clearMark()
			el.setAttribute('data-cursor-hover', '')
			marked = el
			setDot(rect.width + 12, rect.height + 12, true)
			setLabel(el.getAttribute('data-cursor-label') || el.getAttribute('aria-label') || '')
			setPinnedKey(el.getAttribute('data-cursor-label') || el.getAttribute('aria-label') || el.tagName)
		}

		/** drop the mirror attribute, whichever element is holding it */
		const clearMark = () => {
			if (marked) marked.removeAttribute('data-cursor-hover')
			marked = null
		}

		const release = () => {
			snap = null
			pinStarted = true
			clearMark()
			setDot(DOT_SIZE, DOT_SIZE, false)
			setLabel('')
			setPinnedKey('')
		}

		/**
		 * Re-evaluate what sits under the pointer. Idempotent and cheap, so the rAF
		 * loop can run it every frame: that is what keeps the box glued to stacked
		 * rows while the wheel scrolls the page under a still mouse.
		 */
		const refreshHover = () => {
			const el = hitTest()
			// staying inside the pinned element (incl. its padding) is not a change:
			// guarantees exactly one transition per row boundary crossed
			if (el === pinned || (pinned && el && pinned.contains(el))) return
			pinned = el
			if (el) activate(el)
			else release()
		}

		const onMouseMove = (e: MouseEvent) => {
			pointer.x = e.clientX
			pointer.y = e.clientY
			pointer.valid = true
			if (firstMove) {
				firstMove = false
				magnet.x = e.clientX
				magnet.y = e.clientY
				rendered.x = e.clientX
				rendered.y = e.clientY
			}
			// the rAF loop hit-tests with these coordinates on the next frame
		}

		const tick = () => {
			// Re-evaluate what sits under the pointer on *every* frame. Wheel scrolling
			// moves stacked rows under a stationary mouse while nothing else fires, so
			// this is the only place that can notice the row changed — which is also
			// what makes the pointer update in real time instead of at the next move.
			if (pointer.valid) refreshHover()

			if (pinned && !pinned.isConnected) {
				// removed from the DOM (route change, list re-render) — drop the pin
				// and retract the pointer box instead of leaving it on a dead row
				clearMark()
				release()
			} else if (pinned) {
				// target the element's centre every frame: the box glides there when
				// it is first pinned, and once it has arrived it is re-centred
				// directly on the element, so scrolling tracks it 1:1 with no lag
				const rect = pinned.getBoundingClientRect()
				const cx = rect.left + rect.width / 2
				const cy = rect.top + rect.height / 2
				if (!pinStarted) {
					rendered.x += cx - snap!.x
					rendered.y += cy - snap!.y
				} else if (Math.abs(rendered.x - cx) < 0.5 && Math.abs(rendered.y - cy) < 0.5) {
					pinStarted = false
				}
				snap = { x: cx, y: cy }
				setDot(rect.width + 12, rect.height + 12, true)
			}

			// magnet: drift toward the nearest hoverable only when nothing is pinned
			if (!pinned) {
				let closest: HTMLElement | null = null
				let closestDist = MAGNETIC_DISTANCE
				const candidates = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR))
				for (const q of candidates) {
					if (q.closest('[data-cursor-no-magnetic]') && !q.hasAttribute('data-cursor-magnetic')) continue
					const rect = q.getBoundingClientRect()
					const dist = Math.hypot(pointer.x - (rect.left + rect.width / 2), pointer.y - (rect.top + rect.height / 2))
					if (dist < closestDist) {
						closestDist = dist
						closest = q
					}
				}
				if (closest) {
					const c = closest
					const rect = c.getBoundingClientRect()
					const p = (1 - closestDist / MAGNETIC_DISTANCE) * MAGNETIC_STRENGTH
					magnet.x = lerp(pointer.x, rect.left + rect.width / 2, p)
					magnet.y = lerp(pointer.y, rect.top + rect.height / 2, p)
				} else {
					magnet.x = pointer.x
					magnet.y = pointer.y
				}
			}

			// magnet pull only offsets the *rendered* position (magnet/rendered below);
			// it must never touch `pointer`, which is what hit-testing reads.
			// when pinned the target is the element's live centre (cache = snap), which
			// is why the box keeps following the pointer and the scrolled row.
			const target = pinned && snap ? snap : magnet
			const speed = pinned ? 0.22 : 0.28
			rendered.x = lerp(rendered.x, target.x, speed)
			rendered.y = lerp(rendered.y, target.y, speed)
			if (hLineRef.current) hLineRef.current.style.transform = `translateY(${rendered.y}px)`
			if (vLineRef.current) vLineRef.current.style.transform = `translateX(${rendered.x}px)`
			if (dotRef.current) dotRef.current.style.transform = `translate(${rendered.x}px, ${rendered.y}px) translate(-50%, -50%)`
			raf = requestAnimationFrame(tick)
		}

		raf = requestAnimationFrame(tick)
		window.addEventListener('mousemove', onMouseMove)
		return () => {
			cancelAnimationFrame(raf)
			window.removeEventListener('mousemove', onMouseMove)
		}
	}, [])

	return (
		<div className='pointer-events-none fixed inset-0 hidden lg:block' style={{ zIndex: 2147483647 }} aria-hidden>
			<div ref={hLineRef} className='absolute top-0 left-0 h-px w-full' style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
			<div ref={vLineRef} className='absolute top-0 left-0 h-full w-px' style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
			<div
				ref={dotRef}
				data-pinned={pinnedKey}
				className='absolute top-0 left-0 flex items-center justify-center border transition-[width,height,background-color,border-color] duration-150'
				style={{ width: DOT_SIZE, height: DOT_SIZE, backgroundColor: 'var(--color-brand)', borderColor: 'transparent' }}
			>
				<span ref={labelRef} className='text-[9px] tracking-[0.2em] whitespace-nowrap opacity-0 transition-opacity duration-200' style={{ color: 'var(--color-brand)' }} />
			</div>
		</div>
	)
}
