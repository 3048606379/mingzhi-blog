'use client'

import { usePathname } from 'next/navigation'

/** Exact routes that mount `useEditMode` — Ctrl+. toggles edit mode only there. */
const EDIT_ROUTES = ['/blog', '/projects', '/share', '/bloggers']

/**
 * Desktop-only keyboard hints (bottom-left, HUD style).
 * - ESC walks up one route on every non-home page (handled in layout)
 * - CTRL + . toggles edit mode on the list pages that use `useEditMode`
 */
export function KeyHints() {
	const pathname = usePathname()
	if (pathname === '/') return null

	const editCapable = EDIT_ROUTES.includes(pathname)
	const rows: Array<[string, string]> = editCapable
		? [
				['CTRL + .', 'EDIT'],
				['ESC', 'BACK']
			]
		: [['ESC', 'BACK']]

	return (
		<div
			data-key-hints
			className='pointer-events-none fixed bottom-5 left-4 z-30 hidden text-[9px] tracking-[0.3em] md:block'
			style={{ animation: 'hud-row-in 0.5s ease 0.3s both' }}>
			<div className='mb-1.5' style={{ color: '#2e2e2e' }}>
				{'// KEYS'}
			</div>
			{rows.map(([key, action], i) => (
				<div key={key} className='flex items-baseline' style={i > 0 ? { marginTop: 4 } : undefined}>
					<span className='inline-block w-[84px]' style={{ color: '#666' }}>
						{key}
					</span>
					<span style={{ color: '#444' }}>{action}</span>
				</div>
			))}
		</div>
	)
}
