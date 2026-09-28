'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * 弹窗四边的「飞入 / 飞出」动效。
 *
 * create-dialog 与选图弹窗共用这一份实现，避免两处各写一套、动效逐渐跑偏
 * （曾经因为选图弹窗那份改用了带 var() 的 CSS keyframe，被 Lightning CSS 整条丢弃而静默失效）。
 *
 * 用法：
 *   const { exiting, dialogRef, contentRef, edgeRefs, beginExit } = useEdgeFlyIn(onClose)
 *   <div ref={dialogRef}>
 *     <div className='pointer-events-none absolute inset-0 z-10'>
 *       {EDGE_ORDER.map((edge, i) => (
 *         <div key={edge} ref={el => { edgeRefs.current[i] = el }} className={EDGE_CLASS[edge]} />
 *       ))}
 *     </div>
 *     <div ref={contentRef}>...</div>
 *   </div>
 */

const EASE_IN = 'cubic-bezier(0.2, 0.7, 0.2, 1)'

const EDGE_MOVE = {
	top: 'translateX(105vw)',
	right: 'translateY(105vh)',
	bottom: 'translateX(-105vw)',
	left: 'translateY(-105vh)'
} as const

const EDGE_IN_DELAY = { top: 180, right: 120, bottom: 60, left: 0 }
const EDGE_OUT_DELAY = { top: 0, right: 60, bottom: 120, left: 180 }

const EDGE_ANIM_MS = 650
const CONTENT_IN_MS = 300
const CONTENT_OUT_MS = 150

/** 四条边离场需要的最长时间：最大延迟 + 单边时长 */
export const EDGE_EXIT_MS = 180 + EDGE_ANIM_MS

export const EDGE_ORDER = ['top', 'right', 'bottom', 'left'] as const
export type Edge = (typeof EDGE_ORDER)[number]

/** 边线的定位类：横边撑满宽度、竖边撑满高度，粗 2px */
export const EDGE_CLASS: Record<Edge, string> = {
	top: 'absolute top-0 right-0 left-0 h-0.5',
	right: 'absolute top-0 right-0 bottom-0 w-0.5',
	bottom: 'absolute right-0 bottom-0 left-0 h-0.5',
	left: 'absolute top-0 bottom-0 left-0 w-0.5'
}

type EndState = 'opaque' | 'transparent'

interface EdgeFlyInOptions {
	/** 退场开始时额外要做的事（例如淡出遮罩、自己的背景色） */
	onExitStart?: () => void
	/** 退场后是否等一个停顿再真正关闭（有遮罩/内容淡出的弹窗需要） */
	extraDelayMs?: number
	/** 关闭时元素应停在「不透明」还是「透明」，默认不透明以适配父组件卸载 */
	endState?: EndState
}

export function useEdgeFlyIn(onClose: () => void, options: EdgeFlyInOptions = {}) {
	const { onExitStart, extraDelayMs = 0, endState = 'opaque' } = options
	const [exiting, setExiting] = useState(false)
	const [mounted, setMounted] = useState(false)
	const dialogRef = useRef<HTMLDivElement>(null)
	const contentRef = useRef<HTMLDivElement>(null)
	const edgeRefs = useRef<(HTMLDivElement | null)[]>([])

	useEffect(() => {
		setMounted(true)
	}, [])

	const playEdge = (edge: Edge, entering: boolean) => {
		const el = edgeRefs.current[EDGE_ORDER.indexOf(edge)]
		if (!el) return
		const delay = entering ? EDGE_IN_DELAY[edge] : EDGE_OUT_DELAY[edge]
		if (entering) {
			el.animate([{ transform: EDGE_MOVE[edge] }, { transform: 'translate(0, 0)' }], {
				duration: EDGE_ANIM_MS,
				easing: EASE_IN,
				delay,
				fill: 'both'
			})
		} else {
			// 退场只淡出：四边各自延迟淡去，最后一条边结束时整体收尾
			el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: EDGE_ANIM_MS, easing: 'ease', delay, fill: 'forwards' })
		}
	}

	useEffect(() => {
		if (!mounted) return
		for (const edge of EDGE_ORDER) playEdge(edge, true)
		contentRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: CONTENT_IN_MS,
			delay: 120,
			easing: 'ease',
			fill: 'both'
		})
	}, [mounted])

	useEffect(() => {
		if (!exiting) return
		for (const edge of EDGE_ORDER) playEdge(edge, false)
		contentRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: CONTENT_OUT_MS, easing: 'ease', fill: 'forwards' })
		onExitStart?.()
	}, [exiting])

	const beginExit = () => {
		if (exiting) return
		setExiting(true)
		const settle = endState === 'opaque' ? 0 : 60
		window.setTimeout(onClose, EDGE_EXIT_MS + extraDelayMs + settle)
	}

	return { exiting, mounted, dialogRef, contentRef, edgeRefs, beginExit }
}
