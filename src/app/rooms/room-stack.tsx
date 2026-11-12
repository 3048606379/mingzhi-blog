'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ROOM_ORDER, ROOM_PATHS, useRoomStore, type RoomKey } from '@/hooks/use-room-stack'
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

/**
 * 五个二级页面在桌面端合并成一个竖向房间堆栈：
 * - 每个房间至少占满导航与页脚之间的可视区；内容超过一屏时房间跟着长高
 * - 滚轮整屏吸附（snap proximity），长内容房间可以正常往下读
 * - 滚动到哪个房间，地址栏就换成对应路由（replaceState，不触发重新渲染）
 * - 键盘 1-5 / 顶部导航 / 悬浮导航都会滚到对应房间
 * - 移动端（<768px）维持原来的「一页一房间」
 */
export default function RoomStack({ initial }: { initial: RoomKey }) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [active, setActive] = useState<RoomKey>(initial)
	const activeRef = useRef<RoomKey>(initial)
	const maxMD = useSize(state => state.maxMD)
	const initialIndex = ROOM_ORDER.indexOf(initial)

	const sectionTop = (section: HTMLElement, scroller: HTMLElement) =>
		section.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop

	const scrollToRoom = (key: RoomKey, behavior: ScrollBehavior = 'auto') => {
		const el = containerRef.current
		if (!el) return
		const target = el.querySelector<HTMLElement>(`[data-room="${key}"]`)
		if (!target) return
		el.scrollTo({ top: sectionTop(target, el), behavior })
	}

	// 首屏定位 + 把滚动的能力注册给导航
	useLayoutEffect(() => {
		const el = containerRef.current
		if (!el) return
		const target = el.querySelector<HTMLElement>(`[data-room="${initial}"]`)
		if (target) el.scrollTop = sectionTop(target, el)
		useRoomStore.getState().register(scrollToRoom)
		return () => useRoomStore.getState().register(null)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initial, initialIndex])

	useEffect(() => {
		activeRef.current = initial
		setActive(initial)
		useRoomStore.getState().setActive(initial)
	}, [initial])

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
				window.history.replaceState(null, '', ROOM_PATHS[key])
			})
		}
		el.addEventListener('scroll', onScroll, { passive: true })
		return () => {
			el.removeEventListener('scroll', onScroll)
			cancelAnimationFrame(raf)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
			className='scrollbar-none h-full w-full snap-y snap-proximity overflow-y-auto max-md:h-auto max-md:snap-none max-md:overflow-visible'>
			{visible.map(({ key, View }) => (
				<section
					key={key}
					data-room={key}
					className='relative w-full shrink-0 snap-start snap-always md:py-10'>
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
