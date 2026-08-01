'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { useWriteStore } from '../../stores/write-store'
import type { ImageItem } from '../../types'
import Link from 'next/link'

export function ImagesSection() {
	const { images, cover, addUrlImage, addFiles, deleteImage } = useWriteStore()
	const [urlInput, setUrlInput] = useState<string>('')
	const fileInputRef = useRef<HTMLInputElement>(null)

	const coverId = cover?.id ?? null

	const insertAtCursor = (item: ImageItem) => {
		const textarea = useWriteStore.getState().editorRef
		if (!textarea) {
			toast.error('请先点击编辑器正文区域')
			return
		}
		const markdown = item.type === 'url' ? `![](${item.url})` : `![](local-image:${item.id})`
		textarea.focus()
		document.execCommand('insertText', false, markdown)
		toast.success('已插入到光标位置')
	}

	return (
		<div style={{ animation: 'hud-row-in 0.4s ease 0.18s both' }}>
			<div className='flex items-center justify-between'>
				<div className='text-[9px] tracking-[0.35em]' style={{ color: '#444' }}>
					{'// IMAGES'}
				</div>
				<Link href='/image-toolbox' target='_blank' className='text-[10px] tracking-[0.15em] no-underline transition-colors hover:text-white' style={{ color: '#555' }}>
					压缩工具 -&gt;
				</Link>
			</div>

			<div className='mt-4 flex items-center gap-2'>
				<input
					type='text'
					placeholder='https://...'
					className='flex-1 border bg-transparent px-3 py-2 text-xs outline-none transition-colors hover:border-[var(--color-brand)] focus:border-[var(--color-brand)]'
					style={{ color: '#bbb' }}
					value={urlInput}
					onChange={e => setUrlInput(e.target.value)}
				/>
				<button
					className='border bg-transparent px-3 py-2 text-xs tracking-[0.1em] transition-colors hover:border-[var(--color-brand)] hover:text-white'
					style={{ color: '#888' }}
					onClick={() => {
						const v = urlInput.trim()
						if (!v) return
						addUrlImage(v)
						setUrlInput('')
					}}>
					&gt; add
				</button>
			</div>

			<input
				ref={fileInputRef}
				type='file'
				accept='image/*'
				multiple
				className='hidden'
				onChange={e => {
					const files = e.target.files
					if (files && files.length > 0) {
						void addFiles(files)
					}
					if (e.currentTarget) e.currentTarget.value = ''
				}}
			/>

			<div className='mt-3 grid grid-cols-4 gap-2'>
				{/* plus tile */}
				<div
					className='group relative grid aspect-square cursor-pointer place-items-center border text-xl transition-colors hover:border-[var(--color-brand)] hover:text-white'
					style={{ color: '#555' }}
					onClick={() => fileInputRef.current?.click()}
					onDragOver={e => {
						e.preventDefault()
					}}
					onDrop={e => {
						e.preventDefault()
						const files = e.dataTransfer.files
						if (files && files.length) {
							void addFiles(files)
						}
					}}>
					+
				</div>

				{images.map(item => {
					const isUrl = item.type === 'url'
					const src = isUrl ? item.url : item.previewUrl
					const markdown = isUrl ? `![](${item.url})` : `![](local-image:${item.id})`
					const isCover = coverId === item.id

					return (
						<div
							key={item.id}
							className='group relative aspect-square cursor-pointer overflow-hidden border transition-colors hover:border-[var(--color-brand)]'
							style={{ borderColor: isCover ? 'var(--color-brand)' : undefined }}
							title='点击插入到正文光标处'
							onClick={() => insertAtCursor(item)}>
							<img
								src={src}
								className='h-full w-full object-cover'
								draggable
								onDragStart={e => {
									e.dataTransfer.setData('text/plain', markdown)
									e.dataTransfer.setData('text/markdown', markdown)
								}}
							/>
							{isCover && (
								<div className='absolute top-1 left-1 px-1 text-[8px] tracking-[0.2em]' style={{ color: 'var(--color-brand)', backgroundColor: 'rgba(0,0,0,0.7)' }}>
									COVER
								</div>
							)}
							<div className='absolute top-1 right-1 hidden group-hover:flex'>
								<button
									type='button'
									className='px-1 text-xs'
									style={{ color: '#f87171', backgroundColor: 'rgba(0,0,0,0.7)' }}
									onClick={e => {
										e.stopPropagation()
										deleteImage(item.id)
									}}>
									×
								</button>
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
