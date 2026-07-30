'use client'

import { useEffect, useMemo, useState } from 'react'

type TocItem = {
	id: string
	text: string
	level: number
}

type BlogTocProps = {
	toc: TocItem[]
	delay?: number
}

export function BlogToc({ toc, delay = 0 }: BlogTocProps) {
	const [activeIds, setActiveIds] = useState<Set<string>>(new Set())
	const minActiveId = useMemo(() => {
		return Array.from(activeIds).sort((a, b) => toc.findIndex(item => item.id === a) - toc.findIndex(item => item.id === b))[0]
	}, [activeIds, toc])

	useEffect(() => {
		if (toc.length === 0) return

		const observers = new Map<string, IntersectionObserver>()

		// Create observers for each heading
		toc.forEach(item => {
			const element = document.getElementById(item.id)
			if (!element) return

			const observer = new IntersectionObserver(
				entries => {
					entries.forEach(entry => {
						setActiveIds(prev => {
							const newSet = new Set(prev)
							if (entry.isIntersecting) newSet.add(entry.target.id)
							else newSet.delete(entry.target.id)

							return newSet
						})
					})
				},
				{
					rootMargin: '-100px 0px -100px 0px',
					threshold: 0
				}
			)

			observer.observe(element)
			observers.set(item.id, observer)
		})

		return () => {
			observers.forEach(observer => observer.disconnect())
		}
	}, [toc])

	return (
		<div className='w-full' style={{ animation: `hud-row-in 0.4s ease ${delay}s both` }}>
			<div className='text-[9px] tracking-[0.35em]' style={{ color: '#444' }}>
				{'// TOC'}
			</div>
			<div className='scrollbar-none relative mt-3 max-h-[300px] space-y-2 overflow-auto border-l pl-3 text-xs' style={{ borderColor: 'var(--color-border)' }}>
				{toc.length === 0 && <div style={{ color: '#555' }}>&gt; empty</div>}
				{toc.map(item => (
					<a
						key={item.id + item.level}
						href={`#${item.id}`}
						className='relative block no-underline transition-colors hover:text-white'
						style={{ paddingLeft: (item.level - 1) * 12, color: item.id === minActiveId ? 'var(--color-brand)' : '#777' }}>
						{item.id === minActiveId && <span style={{ color: 'var(--color-brand)' }}>&gt; </span>}
						{item.text}
					</a>
				))}
			</div>
		</div>
	)
}
