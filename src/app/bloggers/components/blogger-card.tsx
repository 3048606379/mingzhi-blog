'use client'

import { motion } from 'motion/react'
import StarRating from '@/components/star-rating'
import { useSize } from '@/hooks/use-size'
import { cn } from '@/lib/utils'
import EditableStarRating from '@/components/editable-star-rating'
import { Blogger, type BloggerStatus } from '../grid-view'
import { useState } from 'react'
import AvatarUploadDialog, { type AvatarItem } from './avatar-upload-dialog'

interface BloggerCardProps {
	blogger: Blogger
	isEditMode?: boolean
	onUpdate?: (blogger: Blogger, oldBlogger: Blogger, avatarItem?: AvatarItem) => void
	onDelete?: () => void
}

export function BloggerCard({ blogger, isEditMode = false, onUpdate, onDelete }: BloggerCardProps) {
	const [expanded, setExpanded] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const { maxSM } = useSize()
	const [localBlogger, setLocalBlogger] = useState(blogger)
	const [showAvatarDialog, setShowAvatarDialog] = useState(false)
	const [avatarItem, setAvatarItem] = useState<AvatarItem | null>(null)

	const handleFieldChange = (field: keyof Blogger, value: any) => {
		const updated = { ...localBlogger, [field]: value }
		setLocalBlogger(updated)
		onUpdate?.(updated, blogger, avatarItem || undefined)
	}

	const handleAvatarSubmit = (avatar: AvatarItem) => {
		setAvatarItem(avatar)
		const avatarUrl = avatar.type === 'url' ? avatar.url : avatar.previewUrl
		const updated = { ...localBlogger, avatar: avatarUrl }
		setLocalBlogger(updated)
		onUpdate?.(updated, blogger, avatar)
	}

	const handleCancel = () => {
		setLocalBlogger(blogger)
		setIsEditing(false)
		setAvatarItem(null)
	}

	const canEdit = isEditMode && isEditing

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.6 }}
			{...(maxSM ? { animate: { opacity: 1, scale: 1 } } : { whileInView: { opacity: 1, scale: 1 } })}
			className='relative block overflow-hidden border bg-black/40'
			style={{ borderColor: 'var(--color-border)', transition: 'border-color 0.3s' }}
			onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
			onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}>
			{isEditMode && (
				<div className='absolute top-3 right-3 z-10 flex gap-2'>
					{isEditing ? (
						<>
							<button onClick={handleCancel} className='px-2 py-1.5 text-xs tracking-[0.15em] text-[#888] transition-colors hover:text-white'>
								&gt; 取消
							</button>
							<button onClick={() => setIsEditing(false)} className='px-2 py-1.5 text-xs tracking-[0.15em] transition-colors hover:opacity-80' style={{ color: 'var(--color-brand)' }}>
								&gt; 完成
							</button>
						</>
					) : (
						<>
							<button onClick={() => setIsEditing(true)} className='px-2 py-1.5 text-xs tracking-[0.15em] transition-colors hover:opacity-80' style={{ color: 'var(--color-brand)' }}>
								&gt; 编辑
							</button>
							<button onClick={onDelete} className='px-2 py-1.5 text-xs tracking-[0.15em] transition-colors hover:opacity-80' style={{ color: '#f87171' }}>
								&gt; 删除
							</button>
						</>
					)}
				</div>
			)}

			<div>
				<div className='mb-4 flex items-center gap-4'>
					<div className='group relative'>
						<img
							src={localBlogger.avatar}
							alt={localBlogger.name}
							className={cn('h-16 w-16 border object-cover', canEdit && 'cursor-pointer')}
							style={{ borderColor: 'var(--color-border)' }}
							onClick={() => canEdit && setShowAvatarDialog(true)}
						/>
						{canEdit && (
							<div className='ev pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100'>
								<span className='text-xs text-white'>更换</span>
							</div>
						)}
					</div>
					<div className='flex-1'>
						<h3
							contentEditable={canEdit}
							suppressContentEditableWarning
							onBlur={e => handleFieldChange('name', e.currentTarget.textContent || '')}
							className={cn('group-hover:text-brand text-lg font-bold transition-colors focus:outline-none', canEdit && 'cursor-text')}>
							{localBlogger.name}
						</h3>
						{canEdit ? (
							<div
								contentEditable
								suppressContentEditableWarning
								onBlur={e => handleFieldChange('url', e.currentTarget.textContent || '')}
								className='mt-1 block max-w-[200px] cursor-text truncate text-xs focus:outline-none'
								style={{ color: '#666' }}>
								{localBlogger.url}
							</div>
						) : (
							<a
								href={localBlogger.url}
								target='_blank'
								rel='noopener noreferrer'
								className='mt-1 block max-w-[200px] truncate text-xs hover:underline'
								style={{ color: '#666' }}
								onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-brand)')}
								onMouseLeave={e => (e.currentTarget.style.color = '#666')}>
								{localBlogger.url}
							</a>
						)}
					</div>
				</div>

				{canEdit ? (
					<EditableStarRating stars={localBlogger.stars} editable={true} onChange={stars => handleFieldChange('stars', stars)} />
				) : (
					<StarRating stars={localBlogger.stars} />
				)}

				{canEdit && (
					<div className='mt-2 flex gap-2'>
						{(['recent', 'disconnected'] as BloggerStatus[]).map(status => (
							<button
								key={status}
								type='button'
								onClick={() => handleFieldChange('status', status)}
								className={`border px-3 py-1 text-xs tracking-[0.15em] transition-colors ${
									(localBlogger.status ?? 'recent') === status
										? 'border-[var(--color-brand)] text-[var(--color-brand)]'
										: 'border-[var(--color-border)] text-[#888] hover:border-[var(--color-brand)] hover:text-white'
								}`}>
								{status === 'recent' ? '近期更新' : '长期失联'}
							</button>
						))}
					</div>
				)}

				<p
					contentEditable={canEdit}
					suppressContentEditableWarning
					onBlur={e => handleFieldChange('description', e.currentTarget.textContent || '')}
					onClick={e => {
						if (!canEdit) {
							e.preventDefault()
							setExpanded(!expanded)
						}
					}}
					className={cn(
						'mt-3 text-sm leading-relaxed transition-all duration-300 focus:outline-none',
						canEdit ? 'cursor-text' : 'cursor-pointer',
						!canEdit && (expanded ? 'line-clamp-none' : 'line-clamp-3')
					)}
					style={{ color: '#999' }}>
					{localBlogger.description}
				</p>
			</div>

			{canEdit && showAvatarDialog && (
				<AvatarUploadDialog currentAvatar={localBlogger.avatar} onClose={() => setShowAvatarDialog(false)} onSubmit={handleAvatarSubmit} />
			)}
		</motion.div>
	)
}
