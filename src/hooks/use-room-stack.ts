'use client'

import { create } from 'zustand'

/** 五个「房间」的固定顺序，同时也是键盘 1-5 的顺序 */
export const ROOM_ORDER = ['blog', 'projects', 'share', 'status', 'about'] as const
export type RoomKey = (typeof ROOM_ORDER)[number]

export const ROOM_PATHS: Record<RoomKey, string> = {
	blog: '/blog',
	projects: '/projects',
	share: '/share',
	status: '/status',
	about: '/about'
}

type RoomStackState = {
	/** 当前停在哪个房间（滚动时自动更新） */
	active: RoomKey
	scroller: ((key: RoomKey, behavior?: ScrollBehavior) => void) | null
	setActive: (key: RoomKey) => void
	register: (fn: ((key: RoomKey, behavior?: ScrollBehavior) => void) | null) => void
	/** 有房间堆栈时滚过去并返回 true；没有（如移动端）返回 false */
	go: (key: RoomKey) => boolean
}

export const useRoomStore = create<RoomStackState>((set, get) => ({
	active: 'blog',
	scroller: null,
	setActive: key => set({ active: key }),
	register: fn => set({ scroller: fn }),
	go: key => {
		const fn = get().scroller
		if (!fn) return false
		fn(key, 'smooth')
		return true
	}
}))
