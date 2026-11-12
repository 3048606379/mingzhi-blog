'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ROOM_ORDER, roomHref, useRoomStore, type RoomKey } from '@/hooks/use-room-stack'
import { RoomActiveContext } from '@/hooks/use-room-active'
import { useSize } from '@/hooks/use-size'
import BlogView from '@/app/blog/view'
import ProjectsView from '@/app/projects/view'
import ShareView from '@/app/share/view'
import StatusView from '@/app/status/view'
import AboutView from '@/app/about/view'

const ROOMS: { key: RoomKey; View: React.ComponentType }[] = [
	{ key: 'blog', View: BlogView },
	{ key: 'projects', View: ProjectsView },
	{ key: 'share', View: ShareView },
	{ key: 'status', View: StatusView },
	{ key: 'about', View: AboutView }
]

function sectionTop(section: HTMLElement, scroller: HTMLElement) {
	return section.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop
}

/** 从 #share 这类 hash 里取出房间 key；无效时返回 null */
function readHashRoom(): RoomKey | null {
	if (typeof window === 'undefined') return null
	const key = window.location.hash.replace(/^#/, '') as RoomKey
	return ROOM_ORDER.includes(key) ? key : null
}

/**
 * 五个二级页面在桌面端合并成一个竖向房间堆栈：
 * - 每个房间至少占满导航与页脚之间的可视区；内容超过一屏时房间跟着长高
 * - 滚动停止后分页吸附，静止时视口里只有一个房间
 * - 长内容房间（如 share）内部没有吸附点，可以正常往下读
 * - 滚动到哪个房间，地址栏就换成对应路由（replaceState，不触发重新渲染）
 * - 键盘 1-5 / 顶部导航 / 悬浮导航都会滚到对应房间
 * - 移动端（<768px）维持原来的「一页一房间」
 */
export default function RoomStack({ initial }: { initial: RoomKey }) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [active, setActive] = useState<RoomKey>(initial)
	const activeRef = useRef<RoomKey>(initial)
	const maxMD = useSize(state => state.maxMD)

	const scrollToRoom = (key: RoomKey, behavior: ScrollBehavior = 'auto') => {
		const el = containerRef.current
		if (!el) return
		const target = el.querySelector<HTMLElement>(`[data-room="${key}"]`)
		if (!target) return
		el.scrollTo({ top: sectionTop(target, el), behavior })
	}

	// 首屏定位（支持 /rooms#share）+ 注册桌面端滚动；移动端只显示一间，用 hash 切换
	useLayoutEffect(() => {
		const el = containerRef.current
		if (!el) return
		const startKey = readHashRoom() ?? initial
		activeRef.current = startKey
		setActive(startKey)
		useRoomStore.getState().setActive(startKey)

		if (maxMD) {
			useRoomStore.getState().register(null)
			window.scrollTo(0, 0)
			return () => useRoomStore.getState().register(null)
		}

		const target = el.querySelector<HTMLElement>(`[data-room="${startKey}"]`)
		if (target) el.scrollTop = sectionTop(target, el)
		useRoomStore.getState().register(scrollToRoom)
		return () => useRoomStore.getState().register(null)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initial, maxMD])

	// 滚动时同步「当前房间」+ 地址栏（按每个房间的实际高度判断，不再假设一屏高）
	useEffect(() => {
		const el = containerRef.current
		if (!el) return
		let raf = 0
		const onScroll = () => {
			cancelAnimationFrame(raf)
			raf = requestAnimationFrame(() => {
				const rooms = Array.from(el.querySelectorAll<HTMLElement>('[data-room]'))
				if (!rooms.length) return
				const probe = el.scrollTop + Math.max(24, el.clientHeight * 0.3)
				const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2
				let key = rooms[0].dataset.room as RoomKey
				if (atBottom) {
					key = rooms[rooms.length - 1].dataset.room as RoomKey
				} else {
					for (const room of rooms) {
						if (probe < sectionTop(room, el)) break
						key = room.dataset.room as RoomKey
					}
				}
				if (key === activeRef.current) return
				activeRef.current = key
				setActive(key)
				useRoomStore.getState().setActive(key)
				window.history.replaceState(null, '', roomHref(key))
			})
		}
		el.addEventListener('scroll', onScroll, { passive: true })
		return () => {
			el.removeEventListener('scroll', onScroll)
			cancelAnimationFrame(raf)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// 移动端：导航只改 hash，这里负责切换到对应房间
	useEffect(() => {
		const onHash = () => {
			const key = readHashRoom()
			if (!key) return
			if (window.matchMedia('(max-width: 767px)').matches) {
				activeRef.current = key
				setActive(key)
				useRoomStore.getState().setActive(key)
				window.scrollTo({ top: 0, behavior: 'smooth' })
			} else {
				scrollToRoom(key, 'smooth')
			}
		}
		window.addEventListener('hashchange', onHash)
		return () => window.removeEventListener('hashchange', onHash)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// 滚动停止后分页吸附：视口里同时出现两个房间时，按滚动方向决定停在哪一间。
	// - 短房间：超过 1/4 屏才算翻页，否则回弹
	// - 长房间（share）：内部自由滚动；到边界时向下进入下一房间，向上退回本房间底部
	useEffect(() => {
		const el = containerRef.current
		if (!el) return
		let timer: ReturnType<typeof setTimeout> | null = null
		let lastTop = el.scrollTop
		let direction = 1

		const snap = () => {
			const rooms = Array.from(el.querySelectorAll<HTMLElement>('[data-room]'))
			if (rooms.length <= 1) return

			const top = el.scrollTop
			const vh = el.clientHeight
			const bottom = top + vh
			const tops = rooms.map(room => sectionTop(room, el))
			const visible = rooms.filter((room, i) => tops[i] < bottom - 2 && tops[i] + room.offsetHeight > top + 2)
			if (visible.length <= 1) return

			let index = 0
			for (let i = 0; i < rooms.length; i++) {
				if (tops[i] <= top + 1) index = i
				else break
			}
			const currentTop = tops[index]
			const currentHeight = rooms[index].offsetHeight
			const nextTop = index + 1 < rooms.length ? tops[index + 1] : null
			const threshold = vh * 0.25

			let targetTop = currentTop
			if (currentHeight > vh && nextTop !== null && nextTop < bottom) {
				// 长房间底部与下一房间同时露出：向下进入下一房间，向上退回本房间底部
				targetTop = direction > 0 ? nextTop : Math.max(currentTop, nextTop - vh)
			} else if (direction > 0) {
				// 向下：超过 1/4 屏才翻到下一房间，否则回到当前房间顶部
				if (top - currentTop >= threshold) targetTop = nextTop ?? tops[tops.length - 1]
			} else {
				// 向上：离下一房间顶部不足 1/4 屏就回弹，否则回到上一房间顶部
				if (nextTop !== null && nextTop - top < threshold) targetTop = nextTop
			}

			if (Math.abs(targetTop - top) > 1) el.scrollTo({ top: targetTop, behavior: 'smooth' })
		}

		const onScroll = () => {
			const now = el.scrollTop
			if (now !== lastTop) direction = now > lastTop ? 1 : -1
			lastTop = now
			if (timer) clearTimeout(timer)
			timer = setTimeout(snap, 150)
		}

		el.addEventListener('scroll', onScroll, { passive: true })
		return () => {
			el.removeEventListener('scroll', onScroll)
			if (timer) clearTimeout(timer)
		}
	}, [])

	// 视口高度变化后重新对齐到当前房间顶部
	useEffect(() => {
		const el = containerRef.current
		if (!el) return
		const onResize = () => {
			const target = el.querySelector<HTMLElement>(`[data-room="${activeRef.current}"]`)
			if (target) el.scrollTop = sectionTop(target, el)
		}
		window.addEventListener('resize', onResize)
		return () => window.removeEventListener('resize', onResize)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const visible = ROOMS.filter(room => !maxMD || room.key === active)

	return (
		<div
			ref={containerRef}
			data-room-scroll
			className='scrollbar-none h-full w-full overflow-y-auto max-md:h-auto max-md:overflow-visible'>
			{visible.map(({ key, View }) => (
				<section
					key={key}
					data-room={key}
					className='relative min-h-full w-full shrink-0 md:py-10 max-md:min-h-0'>
					<div
						className='md:mx-auto md:w-full md:max-w-[720px] md:border md:px-10 md:py-12'
						style={{ borderColor: 'var(--color-border)', background: 'rgba(0,0,0,0.82)' }}>
						<RoomActiveContext.Provider value={key === active}>
							<View />
						</RoomActiveContext.Provider>
					</div>
				</section>
			))}
		</div>
	)
}
