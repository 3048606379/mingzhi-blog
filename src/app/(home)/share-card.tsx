'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/card'
import shareList from '@/app/share/list.json'
import Link from 'next/link'

type ShareItem = {
	name: string
	url: string
	logo: string
	description: string
	tags: string[]
	stars: number
}

export default function ShareCard() {
	const [randomItem, setRandomItem] = useState<ShareItem | null>(null)

	useEffect(() => {
		const randomIndex = Math.floor(Math.random() * shareList.length)
		setRandomItem(shareList[randomIndex])
	}, [])

	if (!randomItem) return null

	return (
		<Card>
			<h2 className='text-sm' style={{ color: 'var(--color-secondary)' }}>随机推荐</h2>
			<Link href='/share' className='mt-3 block space-y-2'>
				<div className='flex items-center'>
					<div className='relative mr-3 h-12 w-12 shrink-0 overflow-hidden rounded-lg'>
						<img src={randomItem.logo} alt={randomItem.name} className='h-full w-full object-contain' />
					</div>
					<h3 className='text-sm font-medium'>{randomItem.name}</h3>
				</div>
				<p className='line-clamp-3 text-xs' style={{ color: 'var(--color-secondary)' }}>{randomItem.description}</p>
			</Link>
		</Card>
	)
}
