'use client'

import { useEffect, useState } from 'react'

export function useEditMode(key = '.') {
	const [isEditMode, setIsEditMode] = useState(false)
	const [editLabel, setEditLabel] = useState('')

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (!isEditMode && (e.ctrlKey || e.metaKey) && e.key === key) {
				e.preventDefault()
				setIsEditMode(true)
			}
		}
		window.addEventListener('keydown', handler)
		return () => window.removeEventListener('keydown', handler)
	}, [isEditMode, key])

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
