'use client'

import { useState } from 'react'

import { type AvatarItem } from './components/avatar-upload-dialog'
import { BloggerCard } from './components/blogger-card'

export type BloggerStatus = 'recent' | 'disconnected'

export interface Blogger {
	name: string
	avatar: string
	url: string
	description: string
	stars: number
	status?: BloggerStatus
}

interface GridViewProps {
	bloggers: Blogger[]
	isEditMode?: boolean
	onUpdate?: (blogger: Blogger, oldBlogger: Blogger, avatarItem?: AvatarItem) => void
	onDelete?: (blogger: Blogger) => void
}

export default function GridView({ bloggers, isEditMode = false, onUpdate, onDelete }: GridViewProps) {
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedCategory, setSelectedCategory] = useState<BloggerStatus>('recent')

	const filteredBloggers = bloggers.filter(blogger => {
		const status = blogger.status ?? 'recent'
		const matchesCategory = status === selectedCategory
		const matchesSearch =
			blogger.name.toLowerCase().includes(searchTerm.toLowerCase()) || blogger.description.toLowerCase().includes(searchTerm.toLowerCase())
		return matchesCategory && matchesSearch
	})

	return (
		<div className='mx-auto w-full max-w-7xl px-6 pt-24 pb-12'>
			<div className='mb-8 space-y-4'>
				<input
					type='text'
					placeholder='> 搜索博主...'
					value={searchTerm}
					onChange={e => setSearchTerm(e.target.value)}
					className='mx-auto block w-full max-w-md border border-[var(--color-border)] bg-transparent px-4 py-2 text-xs tracking-[0.1em] outline-none transition-colors placeholder:text-gray-600 hover:border-[var(--color-brand)] focus:border-[var(--color-brand)]'
					style={{ color: '#bbb' }}
				/>

				<div className='flex flex-wrap justify-center gap-2'>
					<button
						onClick={() => setSelectedCategory('recent')}
						className={`border px-4 py-1.5 text-xs tracking-[0.15em] transition-colors ${
							selectedCategory === 'recent' ? 'border-[var(--color-brand)] text-[var(--color-brand)]' : 'border-[var(--color-border)] text-[#888] hover:border-[var(--color-brand)] hover:text-white'
						}`}>
						近期更新
					</button>
					<button
						onClick={() => setSelectedCategory('disconnected')}
						className={`border px-4 py-1.5 text-xs tracking-[0.15em] transition-colors ${
							selectedCategory === 'disconnected' ? 'border-[var(--color-brand)] text-[var(--color-brand)]' : 'border-[var(--color-border)] text-[#888] hover:border-[var(--color-brand)] hover:text-white'
						}`}>
						长期失联
					</button>
				</div>
			</div>

			<div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
				{filteredBloggers.map(blogger => (
					<BloggerCard key={blogger.url} blogger={blogger} isEditMode={isEditMode} onUpdate={onUpdate} onDelete={() => onDelete?.(blogger)} />
				))}
			</div>

			{filteredBloggers.length === 0 && (
				<div className='mt-12 text-center text-xs tracking-[0.2em]' style={{ color: '#555' }}>
					&gt; 没有找到相关博主
				</div>
			)}
		</div>
	)
}
