'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useTransitionNavigate, isPlainClick } from '@/hooks/use-page-transition'

const NAV_ENTRIES = [
	{ href: '/blog', label: 'BLOG', index: '01' },
	{ href: '/projects', label: 'PROJECTS', index: '02' },
	{ href: '/share', label: 'SHARE', index: '03' },
	{ href: '/bloggers', label: 'BLOGGERS', index: '04' },
	{ href: '/about', label: 'ABOUT', index: '05' }
]

interface FloatingNavProps {
	visible: boolean
}

export default function FloatingNav({ visible }: FloatingNavProps) {
	const navigate = useTransitionNavigate()

	useEffect(() => {
		if (!visible) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Backspace') {
				const target = e.target as HTMLElement | null
				if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
				e.preventDefault()
				window.history.back()
			}
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [visible])

	const handleHome = () => navigate('/')
	const handleBack = () => window.history.back()
	const handleTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

	return (
		<div
			data-cursor-no-magnetic
			className='group pointer-events-none fixed top-1/2 right-3 z-30 -translate-y-1/2'
			style={{
				opacity: visible ? 1 : 0,
				transition: 'opacity 0.35s ease'
			}}
		>
			<div
				className='pointer-events-auto flex flex-col items-stretch border'
				style={{
					borderColor: 'var(--color-border)',
					backgroundColor: 'rgba(0,0,0,0.5)',
					backdropFilter: 'blur(6px)',
					animation: visible ? 'floating-nav-enter 0.45s cubic-bezier(0.2,0.7,0.2,1) both' : 'floating-nav-exit 0.3s ease both'
				}}
			>
				<FButton label='TOP' hint='回到顶部' onClick={handleTop} delayMs={0} visible={visible}>
					<svg className='h-4 w-4' viewBox='0 0 12 12' fill='none'>
						<path d='M6 2.5L2.5 6.5M6 2.5L9.5 6.5M6 2.5V9.5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
					</svg>
				</FButton>

				<div className='h-px self-stretch' style={{ backgroundColor: 'var(--color-border)' }} />

				<FButton label='HOME' hint='回到首页' onClick={handleHome} delayMs={40} visible={visible}>
					<svg className='h-4 w-4' viewBox='0 0 12 12' fill='none'>
						<path d='M2 5L6 2L10 5V10H2V5Z' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
					</svg>
				</FButton>

				<div className='h-px self-stretch' style={{ backgroundColor: 'var(--color-border)' }} />

				<FButton label='BACK' hint='返回' onClick={handleBack} delayMs={80} visible={visible}>
					<svg className='h-4 w-4' viewBox='0 0 12 12' fill='none'>
						<path d='M7.5 2.5L3.5 6L7.5 9.5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
					</svg>
				</FButton>

				<div className='grid grid-rows-[0fr] transition-all duration-300 ease-out group-hover:grid-rows-[1fr]'>
					<div className='overflow-hidden'>
						<div className='h-px self-stretch' style={{ backgroundColor: 'var(--color-border)' }} />
						{NAV_ENTRIES.map((entry, i) => (
							<Link
								key={entry.href}
								href={entry.href}
								className='group/link relative flex items-baseline justify-center gap-1.5 px-3 py-2.5 whitespace-nowrap no-underline transition-colors duration-300'
								style={{
									color: '#555',
									animation: visible ? `floating-nav-enter 0.45s cubic-bezier(0.2,0.7,0.2,1) ${0.16 + i * 0.04}s both` : 'none'
								}}
								onClick={e => {
									if (!isPlainClick(e)) return
									e.preventDefault()
									navigate(entry.href)
								}}
							>
								<span
									className='pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/link:opacity-100'
									style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(167,139,250,0.06) 50%, transparent 100%)' }}
								/>
								<span className='text-[8px] tracking-[0.2em]' style={{ color: '#2a2a2a' }}>
									{entry.index}
								</span>
								<span className='text-[10px] tracking-[0.2em] transition-colors duration-300 group-hover/link:text-white'>
									{entry.label}
								</span>
								<span
									className='absolute bottom-0.5 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300 group-hover/link:scale-x-100'
									style={{ backgroundColor: 'var(--color-brand)', boxShadow: '0 0 4px rgba(167,139,250,0.6)' }}
								/>
							</Link>
						))}
					</div>
				</div>
			</div>

		</div>
	)
}

interface FButtonProps {
	label: string
	hint: string
	onClick: () => void
	delayMs: number
	visible: boolean
	children: React.ReactNode
}

function FButton({ label, hint, onClick, delayMs, visible, children }: FButtonProps) {
	return (
		<button
			type='button'
			onClick={onClick}
			aria-label={hint}
			data-cursor-label={label}
			className='group/btn relative flex w-14 flex-col items-center justify-center gap-1 px-2 py-2.5 transition-colors duration-300 hover:text-white'
			style={{
				color: '#555',
				animation: visible ? `floating-nav-enter 0.45s cubic-bezier(0.2,0.7,0.2,1) ${delayMs / 1000}s both` : 'none'
			}}
		>
			<span
				className='pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100'
				style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(167,139,250,0.06) 50%, transparent 100%)' }}
			/>
			{children}
			<span className='text-[8px] tracking-[0.25em]' style={{ color: '#2a2a2a' }}>
				{label}
			</span>
			<span
				className='absolute bottom-0.5 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300 group-hover/btn:scale-x-100'
				style={{ backgroundColor: 'var(--color-brand)', boxShadow: '0 0 4px rgba(167,139,250,0.6)' }}
			/>
		</button>
	)
}
