'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

interface LoginModalProps {
	open: boolean
	onClose: () => void
	onLogin: (password: string) => Promise<boolean>
}

const KEYFRAMES = `
@keyframes login-modal-enter {
	from { opacity: 0; transform: translateY(-12px) scale(0.96); }
	to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes login-modal-exit {
	from { opacity: 1; transform: translateY(0) scale(1); }
	to { opacity: 0; transform: translateY(-12px) scale(0.96); }
}
`

export function LoginModal({ open, onClose, onLogin }: LoginModalProps) {
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [visible, setVisible] = useState(false)
	const [animating, setAnimating] = useState(false)
	const [typedLabel, setTypedLabel] = useState('')
	const styleRef = useRef<HTMLStyleElement | null>(null)

	useEffect(() => {
		if (!styleRef.current) {
			const el = document.createElement('style')
			el.textContent = KEYFRAMES
			document.head.appendChild(el)
			styleRef.current = el
		}
		return () => {
			if (styleRef.current) {
				document.head.removeChild(styleRef.current)
				styleRef.current = null
			}
		}
	}, [])

	useEffect(() => {
		if (open) {
			setVisible(true)
			setAnimating(false)
			setPassword('')
			setTypedLabel('')
			const label = 'AUTH_REQUIRED'
			let i = 0
			const timer = setInterval(() => {
				i++
				setTypedLabel(label.slice(0, i))
				if (i >= label.length) clearInterval(timer)
			}, 35)
			return () => clearInterval(timer)
		} else if (visible) {
			setAnimating(true)
			const timer = setTimeout(() => {
				setVisible(false)
				setAnimating(false)
			}, 200)
			return () => clearTimeout(timer)
		}
	}, [open, visible])

	if (!visible) return null

	const handleSubmit = async () => {
		if (!password.trim()) {
			toast.error('请输入密码')
			return
		}
		setLoading(true)
		try {
			const ok = await onLogin(password)
			if (ok) {
				toast.success('登录成功')
				onClose()
			} else {
				toast.error('密码错误')
			}
		} catch {
			toast.error('登录失败')
		} finally {
			setLoading(false)
		}
	}

	const handleClose = () => {
		onClose()
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') handleSubmit()
		if (e.key === 'Escape') onClose()
	}

	return (
		<div
			className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm'
			style={{ animation: animating ? 'login-modal-exit 0.2s ease both' : 'login-modal-enter 0.25s cubic-bezier(0.2, 0.7, 0.2, 1) both' }}
			onClick={handleClose}
		>
			<div
				className='border p-8'
				style={{ borderColor: 'var(--color-border)', backgroundColor: '#0a0a0a', minWidth: 320 }}
				onClick={e => e.stopPropagation()}
			>
				<div className='mb-6 h-4 text-[10px] tracking-[0.3em]' style={{ color: '#666' }}>
					{'// '}{typedLabel}
					<span style={{ animation: 'splash-blink 0.6s step-end infinite' }}>▋</span>
				</div>
				<input
					type='password'
					value={password}
					onChange={e => setPassword(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder='输入密码...'
					autoFocus
					className='mb-4 w-full border bg-transparent px-4 py-2.5 text-sm tracking-[0.1em] text-white outline-none transition-colors focus:border-[var(--color-brand)]'
					style={{ borderColor: 'var(--color-border)', fontFamily: 'inherit' }}
				/>
				<div className='flex gap-3'>
					<button
						onClick={handleClose}
						className='flex-1 border px-4 py-2 text-xs tracking-[0.15em] transition-colors hover:border-[var(--color-brand)] hover:text-white'
						style={{ borderColor: 'var(--color-border)', color: '#666' }}
					>
						取消
					</button>
					<button
						onClick={handleSubmit}
						disabled={loading}
						className='flex-1 px-4 py-2 text-xs tracking-[0.15em] transition-colors hover:opacity-80 disabled:opacity-40'
						style={{ borderColor: 'var(--color-brand)', color: 'var(--color-brand)', border: '1px solid var(--color-brand)' }}
					>
						{loading ? '...' : '确认'}
					</button>
				</div>
			</div>
		</div>
	)
}
