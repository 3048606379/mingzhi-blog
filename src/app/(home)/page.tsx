'use client'

import { useEffect, useRef } from 'react'
import NavColumns from '@/app/(home)/nav-columns'
import HomeHudPanel from '@/app/(home)/home-hud-panel'
import { useSplashStore } from '@/hooks/use-splash'

function PointerCoords() {
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const onMove = (e: MouseEvent) => {
			if (ref.current) {
				ref.current.textContent = `X ${String(e.clientX).padStart(4, '0')}  Y ${String(e.clientY).padStart(4, '0')}`
			}
		}
		window.addEventListener('mousemove', onMove)
		return () => window.removeEventListener('mousemove', onMove)
	}, [])

	return (
		<div
			ref={ref}
			className='pointer-events-none absolute right-6 bottom-6 z-10 hidden text-[9px] tracking-[0.25em] tabular-nums md:block'
			style={{ color: '#444' }}
		>
			X 0000&nbsp;&nbsp;Y 0000
		</div>
	)
}

export default function Home() {
	const splashDone = useSplashStore(s => s.done)

	return (
		<div className='relative md:h-screen md:overflow-hidden'>
			{/* ambient: breathing glow */}
			<div
				className='pointer-events-none absolute inset-0'
				style={{
					background: 'radial-gradient(circle at 78% 50%, rgba(167,139,250,0.08) 0%, transparent 60%)',
					animation: 'hero-breathe 8s ease-in-out infinite alternate'
				}}
			/>
			<NavColumns />
			<div
				className='pointer-events-none px-6 py-12 md:absolute md:inset-y-0 md:left-0 md:w-[62%] md:overflow-y-auto [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_.cursor-pointer]:pointer-events-auto'
				style={{
					opacity: splashDone ? undefined : 0,
					animation: splashDone ? 'hero-enter-left 1.2s cubic-bezier(0.2, 0.7, 0.2, 1) 0s both' : 'none'
				}}
			>
				<div className='mx-auto w-full max-w-[640px]'>
					<HomeHudPanel />
				</div>
			</div>
			<PointerCoords />
		</div>
	)
}
