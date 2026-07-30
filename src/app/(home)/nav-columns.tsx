'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { useTransitionNavigate, isPlainClick } from '@/hooks/use-page-transition'
import { useSplashStore } from '@/hooks/use-splash'

const NAV_COLUMNS = [
	{ href: '/blog', label: 'BLOG', index: '01' },
	{ href: '/projects', label: 'PROJECTS', index: '02' },
	{ href: '/share', label: 'SHARE', index: '03' },
	{ href: '/bloggers', label: 'BLOGGERS', index: '04' },
	{ href: '/about', label: 'ABOUT', index: '05' }
]

function FlowLine() {
	const ref = useRef<HTMLSpanElement>(null)

	useEffect(() => {
		let timer = 0
		let cancelled = false

		const run = () => {
			const el = ref.current
			if (!el || cancelled) return
			const fromTop = Math.random() < 0.5
			const duration = 900 + Math.random() * 1400
			const pause = 1500 + Math.random() * 5000
			const anim = el.animate(
				[
					{ transform: fromTop ? 'translateY(-100%)' : 'translateY(400%)' },
					{ transform: fromTop ? 'translateY(400%)' : 'translateY(-100%)' }
				],
				{ duration, easing: 'linear' }
			)
			anim.onfinish = () => {
				timer = window.setTimeout(run, pause)
			}
		}

		timer = window.setTimeout(run, Math.random() * 3000)
		return () => {
			cancelled = true
			clearTimeout(timer)
		}
	}, [])

	return (
		<span
			ref={ref}
			className='block h-1/3 w-full'
			style={{
				background: 'linear-gradient(to bottom, transparent, var(--color-brand), transparent)',
				transform: 'translateY(-100%)'
			}}
		/>
	)
}

export default function NavColumns() {
	const navigate = useTransitionNavigate()
	const splashDone = useSplashStore(s => s.done)

	return (
		<div
			className='flex h-screen w-full justify-end border-r md:absolute md:inset-y-0 md:left-[62%] md:h-full md:w-[38%] md:[transform:skewX(-15deg)_translateX(-13.4vh)] md:[transform-origin:right_center]'
			style={{ borderColor: 'var(--color-border)' }}
			data-cursor-no-magnetic
		>
			{NAV_COLUMNS.map((column, i) => (
				<Link
					key={column.href}
					href={column.href}
					className='group relative flex w-16 items-center justify-center border-l no-underline transition-colors duration-300 sm:w-24 md:w-auto md:flex-1'
					style={{
						borderColor: 'var(--color-border)',
						opacity: splashDone ? undefined : 0,
						animation: splashDone ? `hero-enter-right 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) ${0.05 + i * 0.1}s both` : 'none'
					}}
					onClick={e => {
						if (!isPlainClick(e)) return
						e.preventDefault()
						navigate(column.href)
					}}
				>
					{/* flowing light on divider */}
					<span className='pointer-events-none absolute top-0 bottom-0 left-0 w-px overflow-hidden'>
						<FlowLine />
					</span>

						{/* hover background glow */}
						<span
							className='pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100'
							style={{
								background: 'linear-gradient(to bottom, transparent 0%, rgba(167,139,250,0.05) 50%, transparent 100%)'
							}}
						/>

						{/* top / bottom accent lines on hover */}
						<span
							className='absolute top-6 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100'
							style={{ backgroundColor: 'var(--color-brand)', boxShadow: '0 0 6px rgba(167,139,250,0.8), 0 0 2px rgba(167,139,250,0.9)', willChange: 'transform' }}
						/>
						<span
							className='absolute bottom-6 left-0 h-px w-full origin-right scale-x-0 transition-transform duration-500 group-hover:scale-x-100'
							style={{ backgroundColor: 'var(--color-brand)', boxShadow: '0 0 6px rgba(167,139,250,0.8), 0 0 2px rgba(167,139,250,0.9)', willChange: 'transform' }}
						/>

						{/* index number */}
						<span
						className='absolute top-10 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] text-[#333] transition-colors duration-300 group-hover:text-[#888]'
						>
							{column.index}
						</span>

						{/* vertical label */}
						<span
						className='text-sm tracking-[0.5em] text-[#666] transition-colors duration-300 group-hover:text-white'
						style={{ writingMode: 'vertical-rl' }}
						>
							{column.label}
						</span>

						{/* bottom hint */}
						<span
							className='absolute bottom-10 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.3em] opacity-0 transition-opacity duration-500 group-hover:opacity-100'
							style={{ color: 'var(--color-brand)' }}
						>
							ENTER -&gt;
						</span>
					</Link>
				))}

			{/* scroll hint (mobile only) */}
			<div
				className='pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce text-[9px] tracking-[0.4em] md:hidden'
				style={{ color: '#444' }}
			>
				SCROLL ↓
			</div>
		</div>
	)
}
