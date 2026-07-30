'use client'

import Link from 'next/link'

export function HudPageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
	return (
		<header className='mb-10 flex flex-col gap-3' style={{ animation: 'hud-row-in 0.4s ease both' }}>
			<div className='text-[9px] tracking-[0.35em]' style={{ color: '#444' }}>
				{'// '}
				{subtitle ?? 'SECTION'}
			</div>
			<h1 className='text-3xl font-semibold tracking-[0.25em] text-white'>{title}</h1>
			<div className='h-px w-full' style={{ background: 'linear-gradient(to right, var(--color-brand), transparent)' }} />
		</header>
	)
}

type HudRowProps = {
	index: string
	title: string
	desc?: string
	meta?: React.ReactNode
	href: string
	external?: boolean
	delay?: number
}

export function HudRow({ index, title, desc, meta, href, external, delay = 0 }: HudRowProps) {
	const content = (
		<>
			<span className='w-6 shrink-0 text-[10px]' style={{ color: '#3a3a3a' }}>
				{index}
			</span>
			<span className='flex min-w-0 flex-col'>
				<span className='truncate text-sm transition-colors group-hover:text-white' style={{ color: '#bbb' }}>
					{title}
				</span>
				{desc && (
					<span className='mt-0.5 line-clamp-1 text-xs' style={{ color: '#666' }}>
						{desc}
					</span>
				)}
			</span>
			<span className='mb-1 flex-1 border-b border-dashed' style={{ borderColor: '#222' }} />
			{meta && (
				<span className='shrink-0 text-[10px] tracking-[0.15em] tabular-nums' style={{ color: '#555' }}>
					{meta}
				</span>
			)}
			<span
				className='shrink-0 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100'
				style={{ color: 'var(--color-brand)' }}
			>
				-&gt;
			</span>
		</>
	)

	const className = 'group flex items-baseline gap-3 border-b py-3 no-underline'
	const style = { borderColor: 'var(--color-border)', animation: `hud-row-in 0.4s ease ${delay}ms both` }

	if (external) {
		return (
			<a href={href} target='_blank' rel='noreferrer' className={className} style={style}>
				{content}
			</a>
		)
	}
	return (
		<Link href={href} className={className} style={style}>
			{content}
		</Link>
	)
}

export function HudStars({ value }: { value?: number }) {
	if (!value) return null
	return (
		<span style={{ color: 'var(--color-brand)' }}>
			{'★'.repeat(value)}
			<span style={{ color: '#333' }}>{'★'.repeat(Math.max(0, 5 - value))}</span>
		</span>
	)
}
