'use client'

import { type PropsWithChildren, useEffect, useId, useRef } from 'react'

/**
 * 线框房间 · 透视网格墙 —— 纯 2D 数学，没有 WebGL / three.js。
 *
 * 视口中心 = 灭点（vanishing point）。左右两面墙画成"墙板网格"：
 *  - 竖缝：从屏幕中心向两侧铺开，缝距向屏幕边缘缓慢递增（近密远疏）
 *  - 横缝：从灭点射出的浅斜线，越远越收拢
 * 摄像机高度由滚动进度驱动、上下移动：滚动时横缝像贴着墙面滑过（竖缝
 * 自身不动），像坐在升降机里看两面墙。内容是一块半透明面板，房间线条
 * 从它背后透出来；上下的可见部分被标签栏/页脚横线裁住。紫色光效随机
 * 点亮墙面网格里的格子（每帧按当前几何重算，随滚动同步滑动）。
 */

/** 虚拟房间半宽 / 高度（同一世界标度）：ROOM_H/ROOM_W 越大线条越陡，越小越平缓 */
const ROOM_W = 60
const ROOM_H = 280
/** 每面墙的横缝数（射线共 N+1 条，含地板/天花板棱线） */
const SEAMS_DESKTOP = 40
const SEAMS_MOBILE = 20
/** 摄像机升降幅度（占房间高度比例）：滚动到底时相机高度 = 房间高/2·(1∓2·AMP) */
const CAM_AMP = 0.15
/** 墙板竖缝：每侧道数；缝距从屏幕中心向两侧缓慢递增（近密远疏） */
const PANEL_COUNT = 45
const PANEL_GROWTH = 1.12
/** 竖缝离屏幕边缘不足此距离就不铺（留出外侧余量） */
const PANEL_EDGE_GAP = 70

/** 紫色光效（与全站 GridFlicker 同款配色与节奏） */
const GLOW_PEAK = 0.12
const GLOW_DUR_MIN = 900
const GLOW_DUR_MAX = 1800
const GLOW_SPAWN_MS = 220
const GLOW_MAX = 14
/** 光块目标边长（px）：0 = 单个网格单元（不合并）；>0 时合并相邻格到该宽度 */
const GLOW_BLOCK_MIN = 10
const GLOW_MIN_VISIBLE = 6
const GLOW_MERGE_LIMIT = 12

export default function ShareRoom({ children }: PropsWithChildren) {
	const sectionRef = useRef<HTMLElement>(null)
	const panelRef = useRef<HTMLDivElement>(null)
	const svgRef = useRef<SVGSVGElement>(null)
	const pathRef = useRef<SVGPathElement>(null)
	const clipPathRef = useRef<SVGPathElement>(null)
	const glowRef = useRef<HTMLCanvasElement>(null)
	const clipId = `share-room-clip-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

	useEffect(() => {
		const section = sectionRef.current
		const svg = svgRef.current
		const path = pathRef.current
		const clip = clipPathRef.current
		const glow = glowRef.current
		if (!section || !svg || !path || !clip || !glow) return

		const mq = window.matchMedia('(min-width: 768px)')
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
		const amp = reduced ? 0 : CAM_AMP

		let seams = SEAMS_DESKTOP
		let navEl: HTMLElement | null = null
		let footerEl: HTMLElement | null = null
		let p = 0 // 目标滚动进度
		let sp = 0 // 平滑后的进度
		let first = true
		let raf = 0
		let inView = false
		type GlowCell = { side: number; oa: number; ob: number; k0: number; k1: number; t: number; dur: number }
		let glowCells: GlowCell[] = []
		let lastGlowSpawn = 0

		const measure = () => {
			seams = mq.matches ? SEAMS_DESKTOP : SEAMS_MOBILE
			footerEl = document.querySelector('footer')
			navEl = document.querySelector('nav')
			const vw = document.documentElement.clientWidth
			const vh = document.documentElement.clientHeight
			svg.setAttribute('width', String(vw))
			svg.setAttribute('height', String(vh))
			svg.setAttribute('viewBox', `0 0 ${vw} ${vh}`)
			glow.width = vw
			glow.height = vh
			kick()
		}

		// 生成一个光块：随机（侧、竖缝带、横缝带），合并相邻网格单元到目标尺寸；
		// 锚定的是「偏移区间 + 横缝序号区间」，不是屏幕像素 —— 滚动时跟着网格滑
		const spawnGlow = (now: number, vpx: number, vpy: number, camY: number, jointOffs: number[], navBottom: number, footerTop: number) => {
			if (!jointOffs.length) return
			// 距中心的偏移边界：0 = 中心，…，末尾 = 屏幕边
			const ext = [0, ...jointOffs, vpx]
			const seamAt = (x: number, k: number) => vpy + (Math.abs(x - vpx) * (camY - (ROOM_H * k) / seams)) / ROOM_W
			for (let attempt = 0; attempt < 12; attempt++) {
				const side = Math.random() < 0.5 ? -1 : 1
				const i0 = Math.floor(Math.random() * (ext.length - 1))
				// 向外合并到目标宽度
				let i1 = i0
				for (let m = 0; m < GLOW_MERGE_LIMIT && ext[i1 + 1] - ext[i0] < GLOW_BLOCK_MIN && i1 + 1 < ext.length - 1; m++) i1++
				const w = ext[i1 + 1] - ext[i0]
				if (w < GLOW_MIN_VISIBLE) continue
				const xa = vpx + (side < 0 ? -ext[i1 + 1] : ext[i0])
				const xb = vpx + (side < 0 ? -ext[i0] : ext[i1 + 1])
				const xc = (xa + xb) / 2
				// 在可见区里随机取一点，找到它所在的横缝带
				const yStar = navBottom + 20 + Math.random() * Math.max(40, footerTop - navBottom - 40)
				let k0 = -1
				for (let k = 0; k < seams; k++) {
					if (seamAt(xc, k) >= yStar && yStar >= seamAt(xc, k + 1)) {
						k0 = k
						break
					}
				}
				if (k0 < 0) continue
				let k1 = k0 + 1
				// 向下合并到目标高度
				for (let m = 0; m < GLOW_MERGE_LIMIT && k0 > 0 && seamAt(xc, k0) - seamAt(xc, k1) < GLOW_BLOCK_MIN; m++) k0--
				const h = seamAt(xc, k0) - seamAt(xc, k1)
				if (h < GLOW_MIN_VISIBLE) continue
				glowCells.push({ side, oa: ext[i0], ob: ext[i1 + 1], k0, k1, t: now, dur: GLOW_DUR_MIN + Math.random() * (GLOW_DUR_MAX - GLOW_DUR_MIN) })
				return
			}
		}

		const draw = () => {
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

			// 裁剪区域：上 = 标签栏下横线，下 = 页脚上横线（房间只在这两条线之间）
			const navBottom = navEl ? Math.min(vh, Math.max(0, navEl.getBoundingClientRect().bottom)) : 0
			const footerTop = footerEl ? Math.min(vh, Math.max(0, footerEl.getBoundingClientRect().top)) : vh
			clip.setAttribute('d', `M0 ${navBottom.toFixed(1)}H${vw}V${footerTop.toFixed(1)}H0Z`)

			// 一点透视：灭点固定在视口中心。房间由 ROOM_W / ROOM_H 定义
			// （同一世界标度）：横缝组在屏幕边缘的竖直跨度 = 半屏宽×ROOM_H/ROOM_W，
			// ROOM_W 越大越平缓、越小越陡峭；相机高度随滚动升降
			const vpx = vw / 2
			const vpy = vh / 2
			const f = 0.5 - amp * (sp * 2 - 1)
			const camY = ROOM_H * f

			const segs: string[] = []
			const seg = (ax: number, ay: number, bx: number, by: number) =>
				segs.push(`M${ax.toFixed(1)} ${ay.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}`)

			// 横缝：从灭点射出的射线（等距世界高度 → 铺满整个视口高度）
			for (const side of [-1, 1] as const) {
				for (let k = 0; k <= seams; k++) {
					const worldY = (ROOM_H * k) / seams
					const dx = side * ROOM_W
					const dy = camY - worldY
					// 射线离开视口的参数 t（先撞左/右边界或上/下边界即止）
					const tx = dx > 0 ? (vw - vpx) / dx : -vpx / dx
					const ty = Math.abs(dy) < 1e-6 ? Infinity : dy > 0 ? (vh - vpy) / dy : -vpy / dy
					const t = Math.min(tx, ty) + 1.5
					seg(vpx, vpy, vpx + dx * t, vpy + dy * t)
				}
			}

			// 墙板竖缝：从屏幕中心向两侧铺开，缝距向屏幕边缘缓慢递增
			// （尽头即灭点方向 —— 和横缝一样汇聚于屏幕中心）
			const denom = Math.pow(PANEL_GROWTH, PANEL_COUNT) - 1
			const reach = vpx - PANEL_EDGE_GAP
			const jointOffs: number[] = []
			for (let k = 1; k <= PANEL_COUNT; k++) jointOffs.push((reach * (Math.pow(PANEL_GROWTH, k) - 1)) / denom)
			for (const dir of [-1, 1] as const) {
				for (const off of jointOffs) seg(vpx + dir * off, 0, vpx + dir * off, vh)
			}

			// 地板：左右墙「地板棱线」（世界高 0 的横缝）在同一条竖缝深度上的
			// 交点跨屏相连 —— 每个竖缝一条水平格线，构成地板面
			for (const off of jointOffs) {
				const y = vpy + (off * camY) / ROOM_W
				if (y > footerTop + 8) continue
				seg(vpx - off, y, vpx + off, y)
			}

			// 天花板：左右墙「天花板棱线」（世界高 ROOM_H 的横缝）在同一条
			// 竖缝深度上的交点跨屏相连 —— 每个竖缝一条水平格线，构成天花板面
			for (const off of jointOffs) {
				const y = vpy - (off * (ROOM_H - camY)) / ROOM_W
				if (y < navBottom - 8) continue
				seg(vpx - off, y, vpx + off, y)
			}

			path.setAttribute('d', segs.join(''))

			// 紫色光效：随机点亮「墙面网格的格子」（与全站 GridFlicker 同款式）。
			// 每帧按当前几何重算四角 —— 滚动/升降时与网格实时同步滑动
			const now = performance.now()
			if (inView && now - lastGlowSpawn > GLOW_SPAWN_MS) {
				lastGlowSpawn = now
				const tries = Math.random() < 0.4 ? 2 : 1
				for (let n = 0; n < tries && glowCells.length < GLOW_MAX; n++) spawnGlow(now, vpx, vpy, camY, jointOffs, navBottom, footerTop)
			}
			glowCells = glowCells.filter(c => now - c.t < c.dur)
			const gctx = glow.getContext('2d')
			if (gctx) {
				gctx.clearRect(0, 0, vw, vh)
				gctx.save()
				gctx.beginPath()
				gctx.rect(0, navBottom, vw, Math.max(0, footerTop - navBottom))
				gctx.clip()
				for (const c of glowCells) {
					const alpha = Math.sin(((now - c.t) / c.dur) * Math.PI) * GLOW_PEAK
					if (alpha <= 0.002) continue
					const xa = c.side < 0 ? vpx - c.ob : vpx + c.oa
					const xb = c.side < 0 ? vpx - c.oa : vpx + c.ob
					const yTop = (x: number) => vpy + (Math.abs(x - vpx) * (camY - (ROOM_H * c.k1) / seams)) / ROOM_W
					const yBot = (x: number) => vpy + (Math.abs(x - vpx) * (camY - (ROOM_H * c.k0) / seams)) / ROOM_W
					gctx.beginPath()
					gctx.moveTo(xa, yBot(xa))
					gctx.lineTo(xb, yBot(xb))
					gctx.lineTo(xb, yTop(xb))
					gctx.lineTo(xa, yTop(xa))
					gctx.closePath()
					gctx.fillStyle = `rgba(167,139,250,${alpha.toFixed(3)})`
					gctx.fill()
				}
				gctx.restore()
			}
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

		const onResize = () => measure()
		const onMq = () => measure()
		window.addEventListener('resize', onResize)
		mq.addEventListener('change', onMq)

		return () => {
			cancelAnimationFrame(raf)
			io.disconnect()
			window.removeEventListener('resize', onResize)
			mq.removeEventListener('change', onMq)
		}
	}, [])

	return (
		<section ref={sectionRef} className='relative pt-10 pb-24 md:pt-28 md:pb-40'>
			{/* 紫色光效画布：在网格线下层（面板玻璃会自动压暗背后的光块） */}
			<canvas ref={glowRef} data-share-glow aria-hidden className='pointer-events-none fixed inset-0 z-0' />
			<svg
				ref={svgRef}
				aria-hidden
				data-share-room
				className='pointer-events-none fixed inset-0 z-0 h-full w-full'
				style={{ stroke: 'rgba(255,255,255,0.16)', fill: 'none' }}>
				<defs>
					<clipPath id={clipId}>
						<path ref={clipPathRef} clipRule='evenodd' d='' />
					</clipPath>
				</defs>
				<path ref={pathRef} clipPath={`url(#${clipId})`} />
			</svg>
			<div ref={panelRef} className='relative z-10 px-6 py-8 md:px-10 md:py-12' style={{ background: 'rgba(0,0,0,0.5)' }}>
				{children}
			</div>
		</section>
	)
}
