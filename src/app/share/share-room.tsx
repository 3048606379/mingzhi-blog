'use client'

import { type PropsWithChildren, useEffect, useId, useRef } from 'react'

/**
 * wodniack.dev 同款「线框房间」— 纯 2D 数学，没有 WebGL / three.js。
 *
 * 原理：一个 fixed 的 SVG 网格层，每帧用直线把「视口矩形」和「内容列矩形」
 * 的对应点连起来 —— 4 条角线 + 四面墙的等分线 + 每面 3 条二次缓动「扇线」，
 * 让平面的内容列看起来像悬在一个 3D 房间里。内容列随滚动做垂直视差漂移
 * （±R），线网每帧重投影，房间就"活"了。
 *
 * 内层矩形始终待在外层矩形内侧 R 的余量里，所以不会翻转/穿帮。
 */

const COLS_DESKTOP = 12
const COLS_MOBILE = 8
const ROWS = 4
/** 内容列漂移幅度（px）：帧率足够时木有性能问题，纯字符串拼接 */
const DRIFT_DESKTOP = 140
const DRIFT_MOBILE = 70
/** 外层矩形在 section 上下各外扩的余量，必须 >= DRIFT */
const MARGIN_DESKTOP = 180
const MARGIN_MOBILE = 110

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

type Box = { x: number; y: number; w: number; h: number }

export default function ShareRoom({ children }: PropsWithChildren) {
	const sectionRef = useRef<HTMLElement>(null)
	const innerRef = useRef<HTMLDivElement>(null)
	const svgRef = useRef<SVGSVGElement>(null)
	const pathRef = useRef<SVGPathElement>(null)
	const clipRectRef = useRef<SVGRectElement>(null)
	const clipId = `share-room-clip-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

	useEffect(() => {
		const section = sectionRef.current
		const inner = innerRef.current
		const svg = svgRef.current
		const path = pathRef.current
		const clipRect = clipRectRef.current
		if (!section || !inner || !svg || !path || !clipRect) return

		const mq = window.matchMedia('(min-width: 768px)')
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

		let cols = COLS_DESKTOP
		let range = DRIFT_DESKTOP
		let margin = MARGIN_DESKTOP
		let innerBase: Box = { x: 0, y: 0, w: 0, h: 0 }
		let navEl: HTMLElement | null = null
		let footerEl: HTMLElement | null = null
		let p = 0 // 目标滚动进度
		let sp = 0 // 平滑后的进度
		let first = true
		let raf = 0
		let inView = false

		const measure = () => {
			cols = mq.matches ? COLS_DESKTOP : COLS_MOBILE
			range = mq.matches ? DRIFT_DESKTOP : DRIFT_MOBILE
			margin = mq.matches ? MARGIN_DESKTOP : MARGIN_MOBILE
			// offsetLeft/Top 是布局值，不受 transform 影响，可安全缓存
			innerBase = { x: inner.offsetLeft, y: inner.offsetTop, w: inner.offsetWidth, h: inner.offsetHeight }
			footerEl = document.querySelector('footer')
			navEl = document.querySelector('nav')
			const vw = document.documentElement.clientWidth
			const vh = document.documentElement.clientHeight
			svg.setAttribute('width', String(vw))
			svg.setAttribute('height', String(vh))
			svg.setAttribute('viewBox', `0 0 ${vw} ${vh}`)
			clipRect.setAttribute('width', String(vw))
			clipRect.setAttribute('height', String(vh))
			kick()
		}

		const draw = () => {
			const sec = section.getBoundingClientRect()
			const vh = document.documentElement.clientHeight
			const vw = document.documentElement.clientWidth

			// 进度：整页滚动 0..1。兼容两种布局：新版滚 window，线上旧版桌面
			// 是 body 作为滚动容器（window.scrollY 恒为 0），两种都取一遍
			const docEl = document.documentElement
			const scrollTop = Math.max(window.scrollY || 0, docEl.scrollTop || 0, document.body.scrollTop || 0)
			const scrollMax = Math.max(1, Math.max(docEl.scrollHeight, document.body.scrollHeight) - vh)
			p = Math.min(1, Math.max(0, scrollTop / scrollMax))
			if (first || reduced) {
				sp = p
				first = false
			} else {
				sp += (p - sp) * 0.18
				if (Math.abs(p - sp) < 0.001) sp = p
			}

			// 内层随滚动漂移（±range），像悬在房间里。
			// transform 会成为 fixed 后代的包含块 —— 本页所有弹窗都 portal 到
			// body，所以安全；但一旦漂移，就同步挂上 will-change。
			const drifting = !reduced
			const offset = drifting ? range * (sp * 2 - 1) : 0
			if (drifting) {
				inner.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`
				inner.style.willChange = 'transform'
			} else if (inner.style.transform) {
				inner.style.transform = ''
				inner.style.willChange = ''
			}

			// 外层矩形：视口宽度 × section 上下外扩 margin；
			// 顶部以标签栏（nav）的下横线为界、底部以「铭秩」页脚的上横线为界
			// —— 房间就落在两条线之间，界外的几何全部裁掉
			const navBottom = navEl ? Math.min(vh, Math.max(0, navEl.getBoundingClientRect().bottom)) : 0
			const footerTop = footerEl ? Math.min(vh, Math.max(0, footerEl.getBoundingClientRect().top)) : vh
			const outerTop = Math.max(sec.top - margin, navBottom)
			const outerBottom = Math.max(outerTop + 1, Math.min(sec.top + sec.height + margin, footerTop))
			const outer: Box = { x: 0, y: outerTop, w: vw, h: outerBottom - outerTop }
			clipRect.setAttribute('y', String(navBottom))
			clipRect.setAttribute('height', String(Math.max(0, footerTop - navBottom)))
			const box: Box = { x: sec.left + innerBase.x, y: sec.top + innerBase.y + offset, w: innerBase.w, h: innerBase.h }

			const ox1 = outer.x
			const oy1 = outer.y
			const ox2 = outer.x + outer.w
			const oy2 = outer.y + outer.h
			const ix1 = box.x
			const iy1 = box.y
			const ix2 = box.x + box.w
			const iy2 = box.y + box.h

			const segs: string[] = []
			const line = (x1: number, y1: number, x2: number, y2: number) => segs.push(`M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`)

			// 四条角线（外层角 → 内层角）
			const corners: [number, number, number, number][] = [
				[ox1, oy1, ix1, iy1],
				[ox2, oy1, ix2, iy1],
				[ox2, oy2, ix2, iy2],
				[ox1, oy2, ix1, iy2]
			]
			for (const [x1, y1, x2, y2] of corners) line(x1, y1, x2, y2)

			// 上/下墙：外层边缘等分点 → 内层边缘对应等分点
			const colW = outer.w / cols
			const innerColW = box.w / cols
			for (let g = 1; g < cols; g++) {
				line(ox1 + colW * g, oy1, ix1 + innerColW * g, iy1)
				line(ox1 + colW * g, oy2, ix1 + innerColW * g, iy2)
			}

			// 左/右墙
			const rowH = outer.h / cols
			const innerRowH = box.h / cols
			for (let g = 1; g < cols; g++) {
				line(ox1, oy1 + rowH * g, ix1, iy1 + innerRowH * g)
				line(ox2, oy1 + rowH * g, ix2, iy1 + innerRowH * g)
			}

			// 四面扇形线：沿角线按 1-(1-t)^2 分布取点，连成"隧道"纵深感
			const point = (c: [number, number, number, number], d: number) => [lerp(c[0], c[2], d), lerp(c[1], c[3], d)] as const
			const h = 1 / ROWS
			for (let g = 1; g < ROWS; g++) {
				const d = 1 - Math.pow(1 - h * g, 2)
				// 上
				let [ax, ay] = point(corners[0], d)
				let [bx, by] = point(corners[1], d)
				line(ax, ay, bx, by)
				// 下
				;[ax, ay] = point(corners[3], d)
				;[bx, by] = point(corners[2], d)
				line(ax, ay, bx, by)
				// 左
				;[ax, ay] = point(corners[0], d)
				;[bx, by] = point(corners[3], d)
				line(ax, ay, bx, by)
				// 右
				;[ax, ay] = point(corners[1], d)
				;[bx, by] = point(corners[2], d)
				line(ax, ay, bx, by)
			}

			path.setAttribute('d', segs.join(''))
		}

		const frame = () => {
			raf = 0
			draw()
			if (inView || Math.abs(p - sp) > 0.001) raf = requestAnimationFrame(frame)
		}
		const kick = () => {
			if (!raf) raf = requestAnimationFrame(frame)
		}

		measure()
		draw()

		const io = new IntersectionObserver(
			entries => {
				inView = entries[0]?.isIntersecting ?? false
				kick()
			},
			{ rootMargin: '20% 0px' }
		)
		io.observe(section)

		const ro = new ResizeObserver(() => measure())
		ro.observe(inner)

		const onResize = () => measure()
		const onMq = () => measure()
		window.addEventListener('resize', onResize)
		mq.addEventListener('change', onMq)

		return () => {
			cancelAnimationFrame(raf)
			io.disconnect()
			ro.disconnect()
			window.removeEventListener('resize', onResize)
			mq.removeEventListener('change', onMq)
		}
	}, [])

	return (
		<section ref={sectionRef} className='relative pt-10 pb-24 md:pt-28 md:pb-40'>
			<svg
				ref={svgRef}
				aria-hidden
				data-share-room
				className='pointer-events-none fixed inset-0 z-0 h-full w-full'
				style={{ stroke: 'rgba(255,255,255,0.16)', fill: 'none' }}>
				<defs>
					<clipPath id={clipId}>
						<rect ref={clipRectRef} x='0' y='0' width='0' height='0' />
					</clipPath>
				</defs>
				<path ref={pathRef} clipPath={`url(#${clipId})`} />
			</svg>
			<div ref={innerRef} className='relative z-10 border' style={{ borderColor: 'var(--color-border)' }}>
				{children}
			</div>
		</section>
	)
}
