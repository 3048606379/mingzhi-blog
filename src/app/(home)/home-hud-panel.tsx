'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTransitionNavigate, isPlainClick } from '@/hooks/use-page-transition'
import dayjs from 'dayjs'
import { useConfigStore } from './stores/config-store'
import { useLatestBlog } from '@/hooks/use-blog-index'

type SocialItem = { id: string; type: string; value: string; label?: string; order: number }

function SectionHeader({ children }: { children: React.ReactNode }) {
	return (
		<div className='text-[9px] tracking-[0.35em]' style={{ color: '#444' }}>
			{'// '}
			{children}
		</div>
	)
}

function Corner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
	const cls = {
		tl: 'top-0 left-0 border-t border-l',
		tr: 'top-0 right-0 border-t border-r',
		bl: 'bottom-0 left-0 border-b border-l',
		br: 'bottom-0 right-0 border-b border-r'
	}[position]
	return <span className={`absolute h-3 w-3 ${cls}`} style={{ borderColor: 'rgba(167,139,250,0.4)' }} />
}

function useClock() {
	const [clock, setClock] = useState('--:--:--')
	useEffect(() => {
		const update = () => setClock(new Date().toLocaleTimeString('en-GB'))
		update()
		const timer = setInterval(update, 1000)
		return () => clearInterval(timer)
	}, [])
	return clock
}

const TELEMETRY = ['SYS.OK', 'UPTIME 128H', 'MEM 42%', 'NET SECURED', 'CORE STABLE', 'SIGNAL 98%']

function useTelemetry() {
	const [text, setText] = useState('')
	useEffect(() => {
		let msg = 0
		let char = 0
		let timer = 0
		const step = () => {
			const current = TELEMETRY[msg]
			if (char <= current.length) {
				setText(current.slice(0, char))
				char++
				timer = window.setTimeout(step, 70)
			} else {
				timer = window.setTimeout(() => {
					char = 0
					msg = (msg + 1) % TELEMETRY.length
					step()
				}, 2600)
			}
		}
		step()
		return () => clearTimeout(timer)
	}, [])
	return text
}

function useDataId() {
	const [id, setId] = useState(1)
	useEffect(() => {
		const timer = setInterval(() => setId(Math.floor(Math.random() * 9) + 1), 4000)
		return () => clearInterval(timer)
	}, [])
	return id
}

const GLITCH_GLYPHS = '!<>-_\\/[]{}=+*^?#@$%&'

function useGlitch(text: string) {
	const [display, setDisplay] = useState(text)
	useEffect(() => {
		setDisplay(text)
		if (!text) return
		let restore = 0
		const timer = setInterval(() => {
			const i = Math.floor(Math.random() * text.length)
			const glyph = GLITCH_GLYPHS[Math.floor(Math.random() * GLITCH_GLYPHS.length)]
			setDisplay(text.slice(0, i) + glyph + text.slice(i + 1))
			restore = window.setTimeout(() => setDisplay(text), 120)
		}, 5000)
		return () => {
			clearInterval(timer)
			clearTimeout(restore)
		}
	}, [text])
	return display
}

function getGreeting() {
	const hour = new Date().getHours()
	if (hour >= 6 && hour < 12) return 'GOOD MORNING'
	if (hour >= 12 && hour < 18) return 'GOOD AFTERNOON'
	if (hour >= 18 && hour < 22) return 'GOOD EVENING'
	return 'GOOD NIGHT'
}

function socialHref(item: SocialItem) {
	if (item.type === 'email') return `mailto:${item.value}`
	if (/^https?:\/\//.test(item.value)) return item.value
	return `https://${item.value}`
}

export default function HomeHudPanel() {
	const navigate = useTransitionNavigate()
	const clock = useClock()
	const { siteContent } = useConfigStore()
	const { blog, loading } = useLatestBlog()

	const username = siteContent.meta.username || 'MINGZHI'
	const telemetry = useTelemetry()
	const dataId = useDataId()
	const displayName = useGlitch(username.toUpperCase())

	const socials = useMemo(() => {
		const list = (siteContent.socialButtons || []) as SocialItem[]
		return [...list].sort((a, b) => a.order - b.order)
	}, [siteContent.socialButtons])

	const artImages = siteContent.artImages ?? []
	const currentArt = (siteContent.currentArtImageId ? artImages.find(item => item.id === siteContent.currentArtImageId) : undefined) ?? artImages[0]
	const artUrl = currentArt?.url || '/images/art/cat.png'

	return (
		<div className='relative flex flex-col gap-8 py-2'>
			{/* status row */}
			<div className='flex items-center justify-between text-[9px] tracking-[0.3em]' style={{ color: '#555' }}>
				<span>STATUS MONITOR</span>
				<span className='flex items-baseline gap-4'>
					<span style={{ color: 'var(--color-brand)' }}>
						{telemetry}
						<span style={{ animation: 'splash-blink 0.8s step-end infinite' }}>▋</span>
					</span>
					<span className='tabular-nums'>{clock}</span>
				</span>
			</div>

			{/* identity */}
			<section className='flex items-center gap-6'>
				<Link
					href='/live2d'
					className='relative shrink-0 p-2'
					onClick={e => {
						if (!isPlainClick(e)) return
						e.preventDefault()
						navigate('/live2d')
					}}
				>
					<Corner position='tl' />
					<Corner position='tr' />
					<Corner position='bl' />
					<Corner position='br' />
					<img src='/images/avatar.png' alt='avatar' className='h-20 w-20 object-cover' />
					<span className='absolute -bottom-4 left-2 text-[8px] tracking-[0.25em]' style={{ color: '#444' }}>
						DATA-Ø0{dataId}
					</span>
				</Link>
				<div>
					<div className='text-[10px]' style={{ color: 'var(--color-brand)' }}>
						&gt; whoami
					</div>
					<div className='text-linear mt-2 text-3xl font-semibold tracking-[0.15em]'>{displayName}</div>
					<div className='mt-2 text-[10px] tracking-[0.25em]' style={{ color: '#666' }}>
						{getGreeting()}, WELCOME BACK.
					</div>
				</div>
			</section>

			{/* social links */}
			{socials.length > 0 && (
				<section className='flex flex-col gap-3 border-t pt-6' style={{ borderColor: 'var(--color-border)' }}>
					<SectionHeader>SOCIAL_LINKS</SectionHeader>
					<div className='flex flex-col'>
						{socials.map((item, i) => (
							<a
								key={item.id}
								href={socialHref(item)}
								target='_blank'
								rel='noreferrer'
								className='group flex items-baseline gap-3 py-1.5 text-xs no-underline transition-colors'
								style={{ color: '#777' }}
							>
								<span style={{ color: '#3a3a3a' }}>{String(i + 1).padStart(2, '0')}</span>
								<span className='tracking-[0.2em] uppercase transition-colors group-hover:text-white'>
									{item.label || item.type}
								</span>
								<span className='flex-1 border-b border-dashed' style={{ borderColor: '#222' }} />
								<span className='opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100' style={{ color: 'var(--color-brand)' }}>
									-&gt;
								</span>
							</a>
						))}
					</div>
				</section>
			)}

			{/* latest post */}
			<section className='flex flex-col gap-3 border-t pt-6' style={{ borderColor: 'var(--color-border)' }}>
				<SectionHeader>LATEST_POST</SectionHeader>
				{loading ? (
					<div className='text-xs' style={{ color: '#555' }}>
						&gt; fetching...
					</div>
				) : blog ? (
					<Link
						href={`/blog/${blog.slug}`}
						className='group block no-underline'
						onClick={e => {
							if (!isPlainClick(e)) return
							e.preventDefault()
							navigate(`/blog/${blog.slug}`)
						}}
					>
						<div className='text-xs' style={{ color: 'var(--color-brand)' }}>
							&gt; cat ./latest.md
						</div>
						<div className='mt-2 text-sm font-medium transition-colors group-hover:text-white' style={{ color: '#bbb' }}>
							{blog.title || blog.slug}
						</div>
						{blog.summary && (
							<p className='mt-1 line-clamp-2 text-xs leading-relaxed' style={{ color: '#666' }}>
								{blog.summary}
							</p>
						)}
						<div className='mt-2 text-[10px] tracking-[0.2em]' style={{ color: '#444' }}>
							{dayjs(blog.date).format('YYYY.MM.DD')}
						</div>
					</Link>
				) : (
					<div className='text-xs' style={{ color: '#555' }}>
						&gt; no posts yet
					</div>
				)}
			</section>

			{/* art / pictures */}
			<section className='flex flex-col gap-3 border-t pt-6' style={{ borderColor: 'var(--color-border)' }}>
				<SectionHeader>DATA-Ø0{dataId} // PICTURES</SectionHeader>
				<div className='relative cursor-pointer p-2' onClick={() => navigate('/pictures')}>
					<Corner position='tl' />
					<Corner position='tr' />
					<Corner position='bl' />
					<Corner position='br' />
					<img src={artUrl} alt='art' className='h-36 w-full object-cover opacity-70 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0' />
				</div>
			</section>

			{/* actions */}
			<section className='flex flex-col gap-1 border-t pt-6' style={{ borderColor: 'var(--color-border)' }}>
				<SectionHeader>ACTIONS</SectionHeader>
				<button
					onClick={() => navigate('/write')}
					className='group mt-2 flex items-center gap-3 bg-transparent py-1.5 text-left text-xs transition-colors'
					style={{ color: '#777' }}
				>
					<span style={{ color: 'var(--color-brand)' }}>&gt;</span>
					<span className='tracking-[0.2em] transition-colors group-hover:text-white'>write --new</span>
					<span className='opacity-0 transition-opacity group-hover:opacity-100' style={{ color: 'var(--color-brand)' }}>
						▋
					</span>
				</button>
				<button
					onClick={() => navigate('/config')}
					className='group flex items-center gap-3 bg-transparent py-1.5 text-left text-xs transition-colors'
					style={{ color: '#777' }}
				>
					<span style={{ color: 'var(--color-brand)' }}>&gt;</span>
					<span className='tracking-[0.2em] transition-colors group-hover:text-white'>config --open</span>
					<span className='opacity-0 transition-opacity group-hover:opacity-100' style={{ color: 'var(--color-brand)' }}>
						▋
					</span>
				</button>
			</section>
		</div>
	)
}
