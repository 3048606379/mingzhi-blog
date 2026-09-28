'use client'

import { motion } from 'motion/react'
import StarRating from '@/components/star-rating'
import { useSize } from '@/hooks/use-size'
import { cn } from '@/lib/utils'
import EditableStarRating from '@/components/editable-star-rating'
import { useState } from 'react'
import LogoUploadDialog, { type LogoItem } from './logo-upload-dialog'

export interface Share {
	name: string
	logo: string
	url: string
	description: string
	tags: string[]
	stars: number
}

interface ShareCardProps {
	share: Share
	isEditMode?: boolean
	onUpdate?: (share: Share, oldShare: Share, logoItem?: LogoItem) => void
	onDelete?: () => void
}

export function ShareCard({ share, isEditMode = false, onUpdate, onDelete }: ShareCardProps) {
	const [expanded, setExpanded] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const { maxSM } = useSize()
	const [localShare, setLocalShare] = useState(share)
	const [showLogoDialog, setShowLogoDialog] = useState(false)
	const [logoItem, setLogoItem] = useState<LogoItem | null>(null)

	const handleFieldChange = (field: keyof Share, value: any) => {
		const updated = { ...localShare, [field]: value }
		setLocalShare(updated)
		onUpdate?.(updated, share, logoItem || undefined)
	}

	const handleLogoSubmit = (logo: LogoItem) => {
		setLogoItem(logo)
		const logoUrl = logo.type === 'url' ? logo.url : logo.previewUrl
		const updated = { ...localShare, logo: logoUrl }
		setLocalShare(updated)
		onUpdate?.(updated, share, logo)
	}

	const handleTagsChange = (tagsStr: string) => {
		const tags = tagsStr
			.split(',')
			.map(t => t.trim())
			.filter(t => t)
		handleFieldChange('tags', tags)
	}

	const handleCancel = () => {
		setLocalShare(share)
		setIsEditing(false)
		setLogoItem(null)
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
							src={localShare.logo}
							alt={localShare.name}
							className={cn('h-16 w-16 border object-cover', canEdit && 'cursor-pointer')}
							style={{ borderColor: 'var(--color-border)' }}
							onClick={() => canEdit && setShowLogoDialog(true)}
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
							{localShare.name}
						</h3>
						{canEdit ? (
							<div
								contentEditable
								suppressContentEditableWarning
								onBlur={e => handleFieldChange('url', e.currentTarget.textContent || '')}
								className='mt-1 block max-w-[200px] cursor-text truncate text-xs focus:outline-none'
								style={{ color: '#666' }}>
								{localShare.url}
							</div>
						) : (
							<a
								href={localShare.url}
								target='_blank'
								rel='noopener noreferrer'
								className='mt-1 block max-w-[200px] truncate text-xs hover:underline'
								style={{ color: '#666' }}
								onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-brand)')}
								onMouseLeave={e => (e.currentTarget.style.color = '#666')}>
								{localShare.url}
							</a>
						)}
					</div>
				</div>

				{canEdit ? (
					<EditableStarRating stars={localShare.stars} editable={true} onChange={stars => handleFieldChange('stars', stars)} />
				) : (
					<StarRating stars={localShare.stars} />
				)}

				<div className='mt-3 flex flex-wrap gap-1.5'>
					{canEdit ? (
						<input
							type='text'
							value={localShare.tags.join(', ')}
							onChange={e => handleTagsChange(e.target.value)}
							placeholder='> 标签，用逗号分隔'
							className='w-full border border-[var(--color-border)] bg-transparent px-2 py-1 text-xs outline-none transition-colors placeholder:text-gray-600 hover:border-[var(--color-brand)] focus:border-[var(--color-brand)]'
						/>
					) : (
						localShare.tags.map(tag => (
							<span
								key={tag}
								className='px-2 py-0.5 text-[10px] tracking-[0.15em]'
								style={{ color: 'var(--color-brand)', border: '1px solid var(--color-border)', backgroundColor: 'rgba(167,139,250,0.06)' }}>
								{tag}
							</span>
						))
					)}
				</div>

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
					{localShare.description}
				</p>
			</div>

			{canEdit && showLogoDialog && <LogoUploadDialog currentLogo={localShare.logo} onClose={() => setShowLogoDialog(false)} onSubmit={handleLogoSubmit} />}
		</motion.div>
	)
}
