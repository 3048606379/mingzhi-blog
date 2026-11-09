'use client'

import { useEffect, useState } from 'react'
import { useRoomActive } from '@/hooks/use-room-active'

export function useEditMode(key = '.') {
	const [isEditMode, setIsEditMode] = useState(false)
	const [editLabel, setEditLabel] = useState('')
	const roomActive = useRoomActive()

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			// 房间堆栈里只有当前这间响应 Ctrl+.，避免五个页面一起进编辑模式
			if (!roomActive) return
			if ((e.ctrlKey || e.metaKey) && e.key === key) {
				e.preventDefault()
				setIsEditMode(prev => !prev)
			}
		}
		window.addEventListener('keydown', handler)
		return () => window.removeEventListener('keydown', handler)
	}, [key, roomActive])

	useEffect(() => {
		if (!isEditMode) {
			setEditLabel('')
			return
		}
		const label = 'EDIT_MODE'
		let i = 0
		const timer = setInterval(() => {
			i++
			setEditLabel(label.slice(0, i))
			if (i >= label.length) clearInterval(timer)
		}, 35)
		return () => clearInterval(timer)
	}, [isEditMode])

	return { isEditMode, editLabel, setIsEditMode }
}
