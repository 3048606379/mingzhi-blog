'use client'

import { useEffect, useState } from 'react'
import sharesJson from './list.json'
import { HudPageHeader, HudRow, HudStars } from '@/components/hud-page'

interface ShareItem {
	name: string
	url: string
	logo?: string
	description?: string
	stars?: number
	tags?: string[]
}

export default function SharePage() {
	const [shares, setShares] = useState<ShareItem[]>(sharesJson as ShareItem[])

	useEffect(() => {
		fetch('/data/share/list.json').then(r => {
			if (r.ok) return r.json()
			return null
		}).then(data => {
			if (data) setShares(data)
		}).catch(() => {})
	}, [])

	return (
		<>
			<HudPageHeader title='SHARE' subtitle={`${shares.length} LINKS`} />
			<div className='flex flex-col'>
				{shares.map((share, i) => (
					<HudRow
						key={share.name}
						index={String(i + 1).padStart(2, '0')}
						title={share.name}
						desc={share.description}
						meta={<HudStars value={share.stars} />}
						delay={i * 60}
						href={share.url}
						external
					/>
				))}
			</div>
		</>
	)
}
