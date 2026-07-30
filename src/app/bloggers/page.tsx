'use client'

import { useEffect, useState } from 'react'
import bloggersJson from './list.json'
import { HudPageHeader, HudRow, HudStars } from '@/components/hud-page'

interface BloggerItem {
	name: string
	url: string
	avatar?: string
	description?: string
	stars?: number
}

export default function BloggersPage() {
	const [bloggers, setBloggers] = useState<BloggerItem[]>(bloggersJson as BloggerItem[])

	useEffect(() => {
		fetch('/data/bloggers/list.json').then(r => {
			if (r.ok) return r.json()
			return null
		}).then(data => {
			if (data) setBloggers(data)
		}).catch(() => {})
	}, [])

	return (
		<>
			<HudPageHeader title='BLOGGERS' subtitle={`${bloggers.length} SITES`} />
			<div className='flex flex-col'>
				{bloggers.map((blogger, i) => (
					<HudRow
						key={blogger.name}
						index={String(i + 1).padStart(2, '0')}
						title={blogger.name}
						desc={blogger.description}
						meta={<HudStars value={blogger.stars} />}
						delay={i * 60}
						href={blogger.url}
						external
					/>
				))}
			</div>
		</>
	)
}
