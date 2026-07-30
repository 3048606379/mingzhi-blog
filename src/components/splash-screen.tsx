'use client'

import { useEffect, useState } from 'react'
import { useSplashStore } from '@/hooks/use-splash'

const TITLE = 'TENET'
const SUBTITLE = 'CODE · EXPLORE · THINK'
const LOG_LINES = [
	'> booting core system ........... OK',
	'> loading modules [blog, projects, about]',
	'> establishing secure link ...... OK',
	'> syncing content index ......... OK',
	'> rendering interface ........... OK'
]
const BAR_LENGTH = 24
const MONO_FONT = '"JetBrains Mono","SF Mono",Consolas,monospace'

function ScaleRuler({ label, side }: { label: string; side: 'left' | 'right' }) {
	return (
		<div
			className='absolute top-0 bottom-0 hidden w-10 flex-col items-center justify-center sm:flex'
			style={{ [side]: '2.5rem' } as React.CSSProperties}
		>
			<div
				className='h-48 w-3'
				style={{
					backgroundImage:
						'repeating-linear-gradient(to bottom, rgba(167,139,250,0.35) 0 1px, transparent 1px 12px), repeating-linear-gradient(to bottom, rgba(167,139,250,0.15) 0 1px, transparent 1px 4px)',
					backgroundSize: '8px 120px, 4px 120px',
					backgroundPosition: '0 0, 0 0',
					animation: 'splash-scale-scroll 1.2s linear infinite'
				}}
			/>
			<span className='mt-3 text-[9px] tracking-[0.3em]' style={{ color: '#555' }}>
				{label}
			</span>
		</div>
	)
}

function CornerBracket({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
	const positionClass = {
		tl: 'top-6 left-6 border-t border-l',
		tr: 'top-6 right-6 border-t border-r',
		bl: 'bottom-6 left-6 border-b border-l',
		br: 'bottom-6 right-6 border-b border-r'
	}[position]
	return <div className={`absolute h-5 w-5 ${positionClass}`} style={{ borderColor: 'rgba(167,139,250,0.5)' }} />
}

function HudItem({ className, children }: { className: string; children: React.ReactNode }) {
	return (
		<div className={`absolute hidden items-center gap-3 md:flex ${className}`}>
			<span className='h-px w-10' style={{ backgroundColor: '#2a2a2a' }} />
			{children}
		</div>
	)
}

export default function SplashScreen() {
	const [phase, setPhase] = useState<'show' | 'closing' | 'done'>('show')
	const [progress, setProgress] = useState(0)
	const [logCount, setLogCount] = useState(0)
	const [clock, setClock] = useState('--:--:--')

	useEffect(() => {
		document.body.style.overflow = 'hidden'
		document.documentElement.style.overflow = 'hidden'

		setClock(new Date().toLocaleTimeString('en-GB'))
		const clockTimer = setInterval(() => setClock(new Date().toLocaleTimeString('en-GB')), 1000)

		const logTimer = setInterval(() => {
			setLogCount(count => {
				if (count >= LOG_LINES.length) {
					clearInterval(logTimer)
					return count
				}
				return count + 1
			})
		}, 320)

		const progressTimer = setInterval(() => {
			setProgress(value => {
				const next = Math.min(100, value + Math.random() * 3 + 1)
				if (next >= 100) clearInterval(progressTimer)
				return next
			})
		}, 40)

		return () => {
			clearInterval(clockTimer)
			clearInterval(logTimer)
			clearInterval(progressTimer)
			document.body.style.overflow = ''
			document.documentElement.style.overflow = ''
		}
	}, [])

	useEffect(() => {
		if (progress < 100 || phase !== 'show') return
		const closeTimer = setTimeout(() => {
			setPhase('closing')
			useSplashStore.getState().setDone(true)
		}, 150)
		return () => clearTimeout(closeTimer)
	}, [progress, phase])

	useEffect(() => {
		if (phase !== 'closing') return
		const doneTimer = setTimeout(() => {
			setPhase('done')
			document.body.style.overflow = ''
		}, 700)
		return () => clearTimeout(doneTimer)
	}, [phase])

	if (phase === 'done') return null

	const percent = Math.floor(progress)
	const barLine = `> SYSTEM INITIALIZING... [${'/'.repeat(BAR_LENGTH)}] ${String(percent).padStart(2, ' ')}%`

	return (
		<div
			className='fixed inset-0 z-[9999] cursor-pointer bg-black transition-opacity duration-600'
			style={{
				opacity: phase === 'closing' ? 0 : 1,
				pointerEvents: phase === 'closing' ? 'none' : undefined,
				fontFamily: MONO_FONT,
				transitionDuration: '0.6s'
			}}
			onClick={() => setProgress(100)}
		>
			{/* Grid overlay */}
			<div
				className='pointer-events-none absolute inset-0'
				style={{
					backgroundImage:
						'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
					backgroundSize: '60px 60px'
				}}
			/>

			<CornerBracket position='tl' />
			<CornerBracket position='tr' />
			<CornerBracket position='bl' />
			<CornerBracket position='br' />

			<ScaleRuler label='SYS' side='left' />
			<ScaleRuler label='NET' side='right' />

			{/* HUD corners */}
			<HudItem className='top-24 left-10'>
				<span className='text-[9px] tracking-[0.3em]' style={{ color: '#666' }}>
					STATUS MONITOR
				</span>
			</HudItem>
			<HudItem className='top-24 right-10 flex-row-reverse'>
				<span className='text-[9px] tracking-[0.3em]' style={{ color: '#666' }}>
					BIO-SIGNAL DETECTED
				</span>
				<svg viewBox='0 0 100 30' preserveAspectRatio='none' className='h-4 w-16'>
					<polyline
						points='0,15 20,15 25,5 30,25 35,15 50,15 55,5 65,28 75,15 100,15'
						fill='none'
						stroke='var(--color-brand)'
						strokeWidth='1.5'
						strokeDasharray='120 120'
						style={{ animation: 'splash-ekg 1.6s linear infinite' }}
					/>
				</svg>
			</HudItem>
			<HudItem className='bottom-24 left-10'>
				<span className='text-[9px] tracking-[0.3em]' style={{ color: '#666' }}>
					ID-MINGZHI
				</span>
			</HudItem>
			<HudItem className='right-10 bottom-24 flex-row-reverse'>
				<span className='text-[9px] tracking-[0.3em] tabular-nums' style={{ color: '#666' }}>
					{clock}
				</span>
			</HudItem>

			{/* Center content */}
			<div className='relative flex h-full flex-col items-center justify-center px-6'>
				<h1 className='flex text-4xl font-semibold tracking-[0.35em] text-white sm:text-5xl'>
					{TITLE.split('').map((char, index) => (
						<span
							key={index}
							style={{
								display: 'inline-block',
								opacity: 0,
								animation: `splash-rise 0.6s cubic-bezier(0.2, 0.7, 0.3, 1) ${0.3 + index * 0.08}s forwards`
							}}
						>
							{char}
						</span>
					))}
				</h1>
				<div
					className='mt-4 text-[9px] tracking-[0.45em]'
					style={{
						color: 'var(--color-secondary)',
						opacity: 0,
						animation: 'splash-fade-in 0.8s ease 1.1s forwards'
					}}
				>
					{SUBTITLE}
				</div>

				{/* System log */}
				<div className='mt-10 h-[92px] w-full max-w-[340px] text-[10px] leading-relaxed' style={{ color: '#555' }}>
					{LOG_LINES.slice(0, logCount).map((line, index) => (
						<div key={index} style={{ animation: 'splash-fade-in 0.3s ease both' }}>
							{line}
						</div>
					))}
					{logCount < LOG_LINES.length && (
						<span style={{ color: 'var(--color-brand)', animation: 'splash-blink 0.8s step-end infinite' }}>▋</span>
					)}
				</div>

				{/* ASCII progress bar */}
				<div className='relative mt-6 text-[10px] whitespace-pre' style={{ fontFamily: MONO_FONT }}>
					<div style={{ color: '#2e2e2e' }}>{barLine}</div>
					<div
						className='absolute inset-0'
						style={{
							color: 'var(--color-brand)',
							clipPath: `inset(0 ${100 - percent}% 0 0)`
						}}
					>
						{barLine}
					</div>
				</div>
			</div>
		</div>
	)
}
