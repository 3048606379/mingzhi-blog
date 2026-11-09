'use client'

import { createContext, useContext } from 'react'

/** 当前组件是否位于「正在看的那个房间」；不在房间堆栈里（如移动端、独立页）默认为 true */
export const RoomActiveContext = createContext(true)

export function useRoomActive() {
	return useContext(RoomActiveContext)
}
