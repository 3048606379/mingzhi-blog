'use client'

import { useEffect, useState } from 'react'
import aboutJson from './list.json'
import { HudPageHeader } from '@/components/hud-page'

interface AboutData {
	title?: string
	description?: string
	content?: string
	startDate?: string
	onlineCount?: number
	icp?: string
}

function ContentLine({ line }: { line: string }) {
	if (line.startsWith('## ')) {
		return (
			<div className='mt-8 text-[9px] tracking-[0.35em]' style={{ color: '#444' }}>
				{'// '}
				{line.slice(3)}
			</div>
		)
	}
	if (line.startsWith('- ')) {
		return (
			<div className='flex items-baseline gap-3 text-sm' style={{ color: '#999' }}>
				<span style={{ color: 'var(--color-brand)' }}>-</span>
				<span>{line.slice(2)}</span>
			</div>
		)
	}
	return (
		<p className='text-sm leading-relaxed' style={{ color: '#999' }}>
			{line}
		</p>
	)
}

function runtimeSince(dateStr: string): string {
	const start = new Date(dateStr).getTime()
	const now = Date.now()
	const diff = now - start
	if (diff <= 0) return '0s'
	const days = Math.floor(diff / 86400000)
	const hours = Math.floor((diff % 86400000) / 3600000)
	const minutes = Math.floor((diff % 3600000) / 60000)
	const seconds = Math.floor((diff % 60000) / 1000)
	const ms = diff % 1000
	const parts: string[] = []
	if (days > 0) parts.push(`${days}d`)
	if (hours > 0 || parts.length > 0) parts.push(`${String(hours).padStart(2, '0')}h`)
	parts.push(`${String(minutes).padStart(2, '0')}m`)
	parts.push(`${String(seconds).padStart(2, '0')}s`)
	parts.push(`${String(ms).padStart(3, '0')}ms`)
	return parts.join(' ')
}

export default function AboutPage() {
	const [about, setAbout] = useState<AboutData>(aboutJson)
	const [runtime, setRuntime] = useState('')
	const lines = (about.content || '').split('\n').filter(line => line.trim() !== '')

	useEffect(() => {
		if (!about.startDate) return
		setRuntime(runtimeSince(about.startDate))
		const timer = setInterval(() => {
			setRuntime(runtimeSince(about.startDate!))
		}, 100)
		return () => clearInterval(timer)
	}, [about.startDate])

	return (
		<>
			<HudPageHeader title='ABOUT / Tenet' subtitle={about.description} />

			<div className='mb-8 flex flex-wrap gap-4'>
				<div className='flex items-baseline gap-3 text-sm' style={{ color: '#999' }}>
					<span className='text-[9px] tracking-[0.2em]' style={{ color: '#3a3a3a' }}>UPTIME</span>
					<span style={{ color: 'var(--color-brand)' }}>{runtime || '---'}</span>
				</div>
				<div className='w-px self-stretch' style={{ backgroundColor: 'var(--color-border)' }} />
				<div className='flex items-baseline gap-3 text-sm' style={{ color: '#999' }}>
					<span className='text-[9px] tracking-[0.2em]' style={{ color: '#3a3a3a' }}>ONLINE</span>
					<span style={{ color: 'var(--color-brand)' }}>{about.onlineCount ?? 0}</span>
				</div>
				{about.icp && (
					<>
						<div className='w-px self-stretch' style={{ backgroundColor: 'var(--color-border)' }} />
						<div className='flex items-baseline gap-3 text-sm' style={{ color: '#999' }}>
							<span className='text-[9px] tracking-[0.2em]' style={{ color: '#3a3a3a' }}>ICP</span>
							<span style={{ color: 'var(--color-brand)' }}>{about.icp}</span>
						</div>
					</>
				)}
			</div>

			<div className='flex flex-col gap-3'>
				{lines.map((line, i) => (
					<ContentLine key={i} line={line} />
				))}
			</div>
		</>
	)
}
