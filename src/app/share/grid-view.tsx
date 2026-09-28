'use client'

import { useState } from 'react'

import { type LogoItem } from './components/logo-upload-dialog'
import { ShareCard, type Share } from './components/share-card'

interface GridViewProps {
	shares: Share[]
	isEditMode?: boolean
	onUpdate?: (share: Share, oldShare: Share, logoItem?: LogoItem) => void
	onDelete?: (share: Share) => void
}

export default function GridView({ shares, isEditMode = false, onUpdate, onDelete }: GridViewProps) {
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedTag, setSelectedTag] = useState<string>('all')

	const allTags = Array.from(new Set(shares.flatMap(share => share.tags)))

	const filteredShares = shares.filter(share => {
		const matchesSearch = share.name.toLowerCase().includes(searchTerm.toLowerCase()) || share.description.toLowerCase().includes(searchTerm.toLowerCase())
		const matchesTag = selectedTag === 'all' || share.tags.includes(selectedTag)
		return matchesSearch && matchesTag
	})

	return (
		<div className='mx-auto w-full max-w-7xl px-6 pt-24 pb-12'>
			<div className='mb-8 space-y-4'>
				<input
					type='text'
					placeholder='> 搜索资源...'
					value={searchTerm}
					onChange={e => setSearchTerm(e.target.value)}
					className='mx-auto block w-full max-w-md border border-[var(--color-border)] bg-transparent px-4 py-2 text-xs tracking-[0.1em] outline-none transition-colors placeholder:text-gray-600 hover:border-[var(--color-brand)] focus:border-[var(--color-brand)]'
					style={{ color: '#bbb' }}
				/>

				<div className='flex flex-wrap justify-center gap-2'>
					<button
						onClick={() => setSelectedTag('all')}
						className={`border px-4 py-1.5 text-xs tracking-[0.15em] transition-colors ${
							selectedTag === 'all' ? 'border-[var(--color-brand)] text-[var(--color-brand)]' : 'border-[var(--color-border)] text-[#888] hover:border-[var(--color-brand)] hover:text-white'
						}`}>
						全部
					</button>
					{allTags.map(tag => (
						<button
							key={tag}
							onClick={() => setSelectedTag(tag)}
							className={`border px-4 py-1.5 text-xs tracking-[0.15em] transition-colors ${
								selectedTag === tag ? 'border-[var(--color-brand)] text-[var(--color-brand)]' : 'border-[var(--color-border)] text-[#888] hover:border-[var(--color-brand)] hover:text-white'
							}`}>
							{tag}
						</button>
					))}
				</div>
			</div>

			<div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
				{filteredShares.map(share => (
					<ShareCard key={share.url} share={share} isEditMode={isEditMode} onUpdate={onUpdate} onDelete={() => onDelete?.(share)} />
				))}
			</div>

			{filteredShares.length === 0 && (
				<div className='mt-12 text-center text-xs tracking-[0.2em]' style={{ color: '#555' }}>
					&gt; 没有找到相关资源
				</div>
			)}
		</div>
	)
}
