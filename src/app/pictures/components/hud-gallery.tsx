'use client'

import { useState } from 'react'
import dayjs from 'dayjs'
import type { Picture } from '../page'
import { DialogModal } from '@/components/dialog-modal'

type HudGalleryProps = {
	pictures: Picture[]
	isEditMode: boolean
	onDeleteSingle: (pictureId: string, imageIndex: number | 'single') => void
	onDeleteGroup: (picture: Picture) => void
}

export function HudGallery({ pictures, isEditMode, onDeleteSingle, onDeleteGroup }: HudGalleryProps) {
	const [preview, setPreview] = useState<string | null>(null)
	let counter = 0

	return (
		<>
			<div className='flex flex-col gap-8'>
				{pictures.map((picture, gi) => {
					const urls = picture.images ?? (picture.image ? [picture.image] : [])
					if (urls.length === 0) return null

					return (
						<section
							key={picture.id}
							className='flex flex-col gap-3 border-t pt-4'
							style={{ borderColor: 'var(--color-border)', animation: `hud-row-in 0.4s ease ${gi * 0.06}s both` }}
						>
							<div className='flex items-baseline gap-3 text-[10px] tracking-[0.2em]' style={{ color: '#555' }}>
								<span style={{ color: '#3a3a3a' }}>DATA-{String(gi + 1).padStart(3, '0')}</span>
								<span className='tabular-nums'>{dayjs(picture.uploadedAt).format('YYYY.MM.DD')}</span>
								{picture.description && (
									<span className='line-clamp-1 flex-1' style={{ color: '#777' }}>
										{picture.description}
									</span>
								)}
								{isEditMode && (
									<button
										onClick={() => onDeleteGroup(picture)}
										className='shrink-0 tracking-[0.15em]'
										style={{ color: '#f87171', animation: 'hud-row-in 0.3s ease both' }}>
										&gt; 删除整组
									</button>
								)}
							</div>

							<div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4'>
								{urls.map((url, ii) => {
									counter++
									const single = urls.length === 1
									return (
										<div
											key={ii}
											className='group relative aspect-square overflow-hidden border transition-colors duration-300'
											style={{
												borderColor: isEditMode ? 'var(--color-brand)' : 'var(--color-border)',
												boxShadow: isEditMode ? 'inset 0 0 0 1px rgba(167, 139, 250, 0.25)' : 'none',
												transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
											}}>
											<img
												src={url}
												alt=''
												className='h-full w-full cursor-pointer object-cover opacity-80 grayscale-[30%] transition-all duration-500 group-hover:opacity-100 group-hover:grayscale-0'
												onClick={() => !isEditMode && setPreview(url)}
												onError={e => {
													const target = e.currentTarget
													target.style.display = 'none'
												}}
											/>
											<span className='absolute bottom-1 left-1 text-[8px] tracking-[0.2em]' style={{ color: '#666' }}>
												{String(counter).padStart(3, '0')}
											</span>
											{isEditMode && (
												<button
													className='absolute top-1 right-1 px-1 text-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100'
													style={{ color: '#f87171', backgroundColor: 'rgba(0,0,0,0.7)' }}
													onClick={() => onDeleteSingle(picture.id, single ? 'single' : ii)}
												>
													×
												</button>
											)}
										</div>
									)
								})}
							</div>
						</section>
					)
				})}
			</div>

			<DialogModal open={preview !== null} onClose={() => setPreview(null)} className='max-w-none bg-transparent p-0'>
				{preview && (
					<img src={preview} alt='' className='mx-auto max-h-[90vh] max-w-full border object-contain' style={{ borderColor: 'var(--color-border)' }} />
				)}
			</DialogModal>
		</>
	)
}
