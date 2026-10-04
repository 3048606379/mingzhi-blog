'use client'

import { usePathname } from 'next/navigation'

/** Exact routes that mount `useEditMode` — Ctrl+. toggles edit mode only there. */
const EDIT_ROUTES = ['/blog', '/projects', '/share', '/bloggers']

function KeyCap({ children }: { children: React.ReactNode }) {
	return (
		<span
			className='shrink-0 border px-1.5 py-0.5 leading-none'
			style={{ borderColor: 'var(--color-border)', color: '#777', backgroundColor: 'rgba(0,0,0,0.35)' }}>
			{children}
		</span>
	)
}

/**
 * Desktop-only keyboard hints (bottom-left, HUD style).
 * - ESC walks up one route on every non-home page (handled in layout)
 * - CTRL + . toggles edit mode on the list pages that use `useEditMode`
 */
export function KeyHints() {
	const pathname = usePathname()
	if (pathname === '/') return null

	const editCapable = EDIT_ROUTES.includes(pathname)

	return (
		<div
			data-key-hints
			className='pointer-events-none fixed bottom-5 left-4 z-30 hidden flex-col gap-2 border px-3 py-2.5 text-[9px] tracking-[0.25em] md:flex'
			style={{
				borderColor: 'var(--color-border)',
				backgroundColor: 'rgba(0,0,0,0.5)',
				backdropFilter: 'blur(4px)',
				color: '#3a3a3a',
				animation: 'hud-row-in 0.5s ease 0.3s both'
			}}>
			{editCapable && (
				<div className='flex items-center gap-2'>
					<KeyCap>CTRL + .</KeyCap>
					<span>EDIT</span>
				</div>
			)}
			<div className='flex items-center gap-2'>
				<KeyCap>ESC</KeyCap>
				<span>BACK</span>
			</div>
		</div>
	)
}
