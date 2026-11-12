'use client'

import { create } from 'zustand'

/** 五个「房间」的固定顺序，同时也是键盘 1-5 的顺序 */
export const ROOM_ORDER = ['blog', 'projects', 'share', 'status', 'about'] as const
export type RoomKey = (typeof ROOM_ORDER)[number]

/** 五个房间共用一个路由，房间用 #hash 区分（只用于首屏定位，不参与路由） */
export const ROOM_PATH = '/rooms'
export const roomHref = (key: RoomKey) => `${ROOM_PATH}#${key}`
export const isRoomPath = (p: string) => p.split(/[?#]/)[0].replace(/\/$/, '') === ROOM_PATH

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
