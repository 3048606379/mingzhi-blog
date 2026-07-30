'use client'

import { useRef } from 'react'
import { toast } from 'sonner'
import { useWriteStore } from '../../stores/write-store'

export function CoverSection() {
	const { images, setCover, cover, addFiles } = useWriteStore()
	const fileInputRef = useRef<HTMLInputElement>(null)

	const coverPreviewUrl = cover ? (cover.type === 'url' ? cover.url : cover.previewUrl) : null

	const handleCoverDrop = async (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()

		// 处理从图片列表中拖入的情况
		const md = e.dataTransfer.getData('text/markdown') || e.dataTransfer.getData('text/plain') || ''
		const m = /!\[\]\(([^)]+)\)/.exec(md.trim())
		if (m) {
			const target = m[1]
			let foundItem

			if (target.startsWith('local-image:')) {
				const id = target.replace(/^local-image:/, '')
				foundItem = images.find(it => it.id === id)
			} else {
				foundItem = images.find(it => it.type === 'url' && it.url === target)
			}

			if (foundItem) {
				setCover(foundItem)
				toast.success('已设置封面')

				return
			}
		}

		// 处理直接拖入文件的情况
		const files = e.dataTransfer.files
		if (files && files.length > 0) {
			const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
			if (imageFiles.length === 0) {
				toast.error('请拖入图片文件')
				return
			}

			const resultImages = await addFiles(imageFiles as unknown as FileList)
			if (resultImages && resultImages.length > 0) {
				setCover(resultImages[0])
				toast.success('已设置封面')
			}
			return
		}
	}

	const handleClickUpload = () => {
		fileInputRef.current?.click()
	}

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files
		if (!files || files.length === 0) return

		const resultImages = await addFiles(files)
		if (resultImages && resultImages.length > 0) {
			setCover(resultImages[0])
			toast.success('已设置封面')
		}

		e.target.value = ''
	}

	return (
		<div style={{ animation: 'hud-row-in 0.4s ease 0.06s both' }}>
			<div className='text-[9px] tracking-[0.35em]' style={{ color: '#444' }}>
				{'// COVER'}
			</div>
			<input ref={fileInputRef} type='file' accept='image/*' className='hidden' onChange={handleFileChange} />
			<div
				className='mt-4 h-[150px] overflow-hidden border transition-colors hover:border-[var(--color-brand)]'
				onDragOver={e => {
					e.preventDefault()
				}}
				onDrop={handleCoverDrop}>
				{!!coverPreviewUrl ? (
					<img src={coverPreviewUrl} alt='cover preview' className='h-full w-full object-cover' />
				) : (
					<div
						className='grid h-full w-full cursor-pointer place-items-center text-[10px] tracking-[0.2em] transition-colors hover:text-white'
						style={{ color: '#555' }}
						onClick={handleClickUpload}>
						+ drop / click
					</div>
				)}
			</div>
		</div>
	)
}
