'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSplashStore } from '@/hooks/use-splash'

/**
 * Scroll affordance for the desktop home page (bottom-centre of the content
 * column, left 62%).
 *
 * Why a module: the desktop home page hides its overflow — `#home-content` is
 * the real scroll container on `md+` (`md:overflow-y-auto`), while mobile and
 * every other route scroll the window. Resolving that here keeps the cue
 * independent of the layout, and gives the planned stepped-scroll work (Lenis
 * + per-section steps) one place to hang off.
 *
 * Deliberately additive: nothing existing is modified. The mobile-only
 * `SCROLL ↓` inside `nav-columns.tsx` is `md:hidden` and stays untouched, and
 * `KeyHints` already returns `null` on `/`, so the bottom-left of the home
 * page is free.
 */

/** Scroll offset (px) past which the cue is considered "used" and fades out. */
const HIDE_AT = 24

/** Fraction of a viewport one click advances. */
const STEP_RATIO = 0.85

/**
 * The element that actually scrolls on this route: the inner panel when it
 * overflows (desktop), otherwise `null` meaning the window owns the scroll.
 * A container that does not overflow is not returned, so mobile — where
 * `#home-content` is a plain static block — falls through to the window.
 */
export function getHomeScroller(): HTMLElement | null {
	const el = document.getElementById('home-content')
	if (!el) return null
	return el.scrollHeight - el.clientHeight > 4 ? el : null
}

function prefersReducedMotion() {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Scroll offset + whether anything can actually scroll on this route. */
function useHomeScrollState() {
	const [state, setState] = useState({ offset: 0, hasRoom: false })

	useEffect(() => {
		let raf = 0
		const read = () => {
			const scroller = getHomeScroller()
			const offset = scroller ? scroller.scrollTop : window.scrollY
			const room = scroller
				? scroller.scrollHeight - scroller.clientHeight
				: document.documentElement.scrollHeight - window.innerHeight
			const next = { offset, hasRoom: room > 4 }
			setState(prev => (prev.offset === next.offset && prev.hasRoom === next.hasRoom ? prev : next))
		}
		const onScroll = () => {
			cancelAnimationFrame(raf)
			raf = requestAnimationFrame(read)
		}

		read()
		// capture phase: scroll events do not bubble, so this sees both the
		// inner panel and the window without binding to either up front
		document.addEventListener('scroll', onScroll, { capture: true, passive: true })
		window.addEventListener('resize', onScroll)
		// content can grow after mount (site config loads async) — re-measure
		const ro = new ResizeObserver(onScroll)
		ro.observe(document.body)
		const panel = document.getElementById('home-content')
		if (panel) ro.observe(panel)
		return () => {
			cancelAnimationFrame(raf)
			document.removeEventListener('scroll', onScroll, { capture: true })
			window.removeEventListener('resize', onScroll)
			ro.disconnect()
		}
	}, [])

	return state
}

export default function ScrollCue() {
	const splashDone = useSplashStore(s => s.done)
	const { offset, hasRoom } = useHomeScrollState()

	// nothing to scroll → no cue at all (a button that can never do anything
	// is worse than no affordance)
	if (!hasRoom) return null

	const visible = offset <= HIDE_AT

	const advance = useCallback(() => {
		const scroller = getHomeScroller()
		const amount = (scroller ? scroller.clientHeight : window.innerHeight) * STEP_RATIO
		const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth'
		if (scroller) scroller.scrollBy({ top: amount, behavior })
		else window.scrollBy({ top: amount, behavior })
	}, [])

	return (
		<div
			data-scroll-cue
			className='pointer-events-none absolute bottom-0 left-0 z-20 hidden justify-center md:flex md:w-[62%]'
			style={{ opacity: visible ? 1 : 0, transition: 'opacity 450ms ease' }}
			aria-hidden={!visible}
		>
			{/* scrim: the panel scrolls behind this, so fade the seam to black
			    instead of letting the cue collide with body copy */}
			<div
				className='pointer-events-none absolute inset-x-0 bottom-0 h-28'
				style={{ background: 'linear-gradient(to top, #000 0%, rgba(0,0,0,0.86) 45%, transparent 100%)' }}
			/>

			<button
				type='button'
				onClick={advance}
				tabIndex={visible ? 0 : -1}
				aria-label='向下滚动查看内容'
				data-cursor-label='SCROLL'
				className={`group relative mb-6 flex flex-col items-center gap-2.5 bg-transparent ${visible ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}`}
				style={{
					opacity: splashDone ? undefined : 0,
					animation: splashDone ? 'hud-row-in 0.6s ease 0.9s both' : 'none'
				}}
			>
				{/* hairline track with a brand pulse travelling down it */}
				<span
					className='relative block h-10 w-px overflow-hidden transition-opacity duration-500'
					style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.16), transparent)' }}
				>
					<span
						data-scroll-cue-anim
						className='absolute left-0 block h-1/3 w-full'
						style={{
							background: 'linear-gradient(to bottom, transparent, var(--color-brand), transparent)',
							animation: 'scroll-cue-flow 2.4s linear infinite'
						}}
					/>
				</span>

				<span
					className='text-[9px] tracking-[0.4em] transition-colors duration-300 group-hover:text-[var(--color-brand)]'
					style={{ color: '#444' }}
				>
					SCROLL{' '}
					<span data-scroll-cue-anim className='inline-block' style={{ animation: 'scroll-cue-arrow 1.8s ease-in-out infinite' }}>
						↓
					</span>
				</span>
			</button>
		</div>
	)
}
