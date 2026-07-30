'use client'

import type { SiteContent } from '../../stores/config-store'
import type { ArtImageUploads, FileItem, SocialButtonImageUploads } from './types'
import { FaviconAvatarUpload } from './favicon-avatar-upload'
import { SiteMetaForm } from './site-meta-form'
import { ArtImagesSection } from './art-images-section'
import { SocialButtonsSection } from './social-buttons-section'
import { SectionHeader } from './section-header'

export type { FileItem, ArtImageUploads, BackgroundImageUploads, SocialButtonImageUploads } from './types'

interface SiteSettingsProps {
	formData: SiteContent
	setFormData: React.Dispatch<React.SetStateAction<SiteContent>>
	faviconItem: FileItem | null
	setFaviconItem: React.Dispatch<React.SetStateAction<FileItem | null>>
	avatarItem: FileItem | null
	setAvatarItem: React.Dispatch<React.SetStateAction<FileItem | null>>
	artImageUploads: ArtImageUploads
	setArtImageUploads: React.Dispatch<React.SetStateAction<ArtImageUploads>>
	socialButtonImageUploads: SocialButtonImageUploads
	setSocialButtonImageUploads: React.Dispatch<React.SetStateAction<SocialButtonImageUploads>>
}

export function SiteSettings({
	formData,
	setFormData,
	faviconItem,
	setFaviconItem,
	avatarItem,
	setAvatarItem,
	artImageUploads,
	setArtImageUploads,
	socialButtonImageUploads,
	setSocialButtonImageUploads
}: SiteSettingsProps) {
	return (
		<div className='space-y-8'>
			<FaviconAvatarUpload faviconItem={faviconItem} setFaviconItem={setFaviconItem} avatarItem={avatarItem} setAvatarItem={setAvatarItem} />

			<SiteMetaForm formData={formData} setFormData={setFormData} />

			<SocialButtonsSection
				formData={formData}
				setFormData={setFormData}
				socialButtonImageUploads={socialButtonImageUploads}
				setSocialButtonImageUploads={setSocialButtonImageUploads}
			/>

			<ArtImagesSection formData={formData} setFormData={setFormData} artImageUploads={artImageUploads} setArtImageUploads={setArtImageUploads} />

		<div>
			<SectionHeader>OPTIONS</SectionHeader>
			<div className='grid grid-cols-2 gap-x-6 gap-y-3'>
				{[
					{
						id: 'opt-summary-in-content',
						checked: formData.summaryInContent ?? false,
						onChange: (v: boolean) => setFormData({ ...formData, summaryInContent: v }),
						label: '摘要放入内容'
					},
					{
						id: 'opt-hide-edit-button',
						checked: formData.hideEditButton ?? false,
						onChange: (v: boolean) => setFormData({ ...formData, hideEditButton: v }),
						label: '隐藏编辑按钮（ctrl/cmd + ,）'
					},
					{
						id: 'opt-enable-categories',
						checked: formData.enableCategories ?? false,
						onChange: (v: boolean) => setFormData({ ...formData, enableCategories: v }),
						label: '启用文章分类'
					}
				].map(opt => (
					<label
						key={opt.id}
						htmlFor={opt.id}
						className='group flex w-fit cursor-pointer items-center gap-2 text-xs select-none transition-colors hover:text-white'
						style={{ color: '#777' }}>
						<span
							className='grid h-3.5 w-3.5 place-items-center border transition-colors'
							style={{ borderColor: opt.checked ? 'var(--color-brand)' : 'var(--color-border)' }}>
							{opt.checked && (
								<svg className='h-2.5 w-2.5' viewBox='0 0 12 12' fill='none'>
									<path d='M2 6.5l2.5 2.5L10 3.5' stroke='var(--color-brand)' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
								</svg>
							)}
						</span>
						<input id={opt.id} type='checkbox' checked={opt.checked} onChange={e => opt.onChange(e.target.checked)} className='sr-only' />
						{opt.label}
					</label>
				))}
			</div>
		</div>
	</div>
	)
}
