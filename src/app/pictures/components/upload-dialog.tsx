'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import type { ImageItem } from '../../projects/components/image-upload-dialog'

interface UploadDialogProps {
	onClose: () => void
	onSubmit: (payload: { images: ImageItem[]; description: string }) => void
}

const EASE_IN = 'cubic-bezier(0.2, 0.7, 0.2, 1)'
const EASE_OUT = 'cubic-bezier(0.55, 0, 1, 0.45)'

const EDGE_MOVE = {
	top: 'translateX(105vw)',
	right: 'translateY(105vh)',
	bottom: 'translateX(-105vw)',
	left: 'translateY(-105vh)'
} as const
const EDGE_IN_DELAY = { top: 180, right: 120, bottom: 60, left: 0 }
const EDGE_OUT_DELAY = { top: 0, right: 60, bottom: 120, left: 180 }

const labelStyle = { color: '#444' }
const dimStyle = { color: '#3a3a3a' }
const borderColor = 'var(--color-border)'
const edgeColor = 'var(--color-brand)'

export default function UploadDialog({ onClose, onSubmit }: UploadDialogProps) {
	const [description, setDescription] = useState('')
	const [images, setImages] = useState<ImageItem[]>([])
	const [exiting, setExiting] = useState(false)
	const [mounted, setMounted] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const topEdgeRef = useRef<HTMLDivElement>(null)
	const rightEdgeRef = useRef<HTMLDivElement>(null)
	const bottomEdgeRef = useRef<HTMLDivElement>(null)
	const leftEdgeRef = useRef<HTMLDivElement>(null)
	const contentRef = useRef<HTMLDivElement>(null)
	const dialogRef = useRef<HTMLDivElement>(null)

	const playEdge = (edge: 'top' | 'right' | 'bottom' | 'left', entering: boolean) => {
		const refs = { top: topEdgeRef, right: rightEdgeRef, bottom: bottomEdgeRef, left: leftEdgeRef }
		const el = refs[edge].current
		if (!el) return
		const move = EDGE_MOVE[edge]
		const delay = entering ? EDGE_IN_DELAY[edge] : EDGE_OUT_DELAY[edge]
		if (entering) {
			el.animate([{ transform: move }, { transform: 'translate(0, 0)' }], {
				duration: 650,
				easing: EASE_IN,
				delay,
				fill: 'both'
			})
		} else {
			el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 650, easing: 'ease', delay, fill: 'forwards' })
		}
	}

	useEffect(() => {
		setMounted(true)
	}, [])

	useEffect(() => {
		if (!mounted) return
		playEdge('top', true)
		playEdge('right', true)
		playEdge('bottom', true)
		playEdge('left', true)
		contentRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 120, easing: 'ease', fill: 'both' })
	}, [mounted])

	useEffect(() => {
		if (!exiting) return
		playEdge('top', false)
		playEdge('right', false)
		playEdge('bottom', false)
		playEdge('left', false)
		contentRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: 'ease', fill: 'forwards' })
		dialogRef.current?.animate(
			[{ backgroundColor: 'rgba(0, 0, 0, 1)' }, { backgroundColor: 'rgba(0, 0, 0, 0)' }],
			{ duration: 650, easing: 'ease', delay: 0, fill: 'both' }
		)
	}, [exiting])

	useEffect(() => {
		const previous = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		return () => {
			document.body.style.overflow = previous
		}
	}, [])

	const beginExit = (revokeUrls: boolean) => {
		if (exiting) return
		if (revokeUrls) {
			images.forEach(image => {
				if (image.type === 'file') {
					URL.revokeObjectURL(image.previewUrl)
				}
			})
		}
		setExiting(true)
		window.setTimeout(() => onClose(), 880)
	}

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || [])
		if (files.length === 0) return

		const nextImages: ImageItem[] = []

		for (const file of files) {
			if (!file.type.startsWith('image/')) {
				toast.error('请选择图片文件')
				return
			}

			const previewUrl = URL.createObjectURL(file)
			nextImages.push({
				type: 'file',
				file,
				previewUrl
			})
		}

		setImages(nextImages)
	}

	const handleSubmit = () => {
		if (images.length === 0) {
			toast.error('请至少选择一张图片')
			return
		}

		onSubmit({
			images,
			description
		})

		setImages([])
		setDescription('')
		beginExit(false)
	}

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && !exiting) {
				beginExit(true)
			}
		}
		window.addEventListener('keydown', handler)
		return () => window.removeEventListener('keydown', handler)
	}, [exiting, images])

	if (!mounted) return null

	return createPortal(
		<div
			className='fixed inset-0 z-50 flex items-center justify-center p-4'
			style={{ pointerEvents: exiting ? 'none' : 'auto' }}
			onClick={() => beginExit(true)}>
			<div
				ref={dialogRef}
				className='relative w-lg max-sm:w-full overflow-visible bg-black'
				onClick={e => e.stopPropagation()}>
				<div className='pointer-events-none absolute inset-0 z-10'>
					<div ref={topEdgeRef} className='absolute top-0 left-0 right-0 h-0.5' style={{ backgroundColor: edgeColor }} />
					<div ref={rightEdgeRef} className='absolute right-0 top-0 bottom-0 w-0.5' style={{ backgroundColor: edgeColor }} />
					<div ref={bottomEdgeRef} className='absolute bottom-0 left-0 right-0 h-0.5' style={{ backgroundColor: edgeColor }} />
					<div ref={leftEdgeRef} className='absolute top-0 bottom-0 left-0 w-0.5' style={{ backgroundColor: edgeColor }} />
				</div>

				<div ref={contentRef} className='p-8 max-sm:p-5'>
					<div className='flex items-center justify-between text-[10px] tracking-[0.3em]' style={{ color: '#666' }}>
						<span>
							{'// '}UPLOAD_IMAGES<span style={{ animation: 'splash-blink 0.6s step-end infinite' }}>▋</span>
						</span>
						<span className='text-[9px]' style={dimStyle}>
							PICTURES://{images.length === 0 ? 'EMPTY' : `${String(images.length).padStart(3, '0')} FILES`}
						</span>
					</div>

					<div className='mt-7 space-y-6 border-t pt-6' style={{ borderColor }}>
						<div>
							<div className='mb-2 flex items-baseline gap-3 text-[9px] tracking-[0.35em]' style={labelStyle}>
								{'// '}SELECT_IMAGES <span style={dimStyle}>· MULTI_ALLOWED</span>
							</div>
							<input ref={fileInputRef} type='file' accept='image/*' multiple className='hidden' onChange={handleFileSelect} />

							{images.length === 0 ? (
								<div
									onClick={() => fileInputRef.current?.click()}
									className='flex h-36 cursor-pointer flex-col items-center justify-center gap-2.5 border border-dashed transition-colors hover:border-[var(--color-brand)]'
									style={{ borderColor, animation: 'hud-row-in 0.4s ease both' }}>
									<Plus className='h-6 w-6' style={{ color: 'var(--color-brand)' }} />
									<p className='text-xs tracking-[0.2em]' style={{ color: '#777' }}>
										&gt; CLICK_TO_SELECT
									</p>
									<p className='text-[9px] tracking-[0.3em]' style={dimStyle}>
										JPG · PNG · WEBP · GIF
									</p>
								</div>
							) : (
								<>
									<div
										className='grid grid-cols-3 gap-2 border p-2'
										style={{ borderColor, animation: 'hud-row-in 0.4s ease both' }}>
										{images.map((image, index) =>
											image.type === 'file' ? (
												<div key={index} className='relative aspect-video overflow-hidden border bg-black' style={{ borderColor }}>
													<img src={image.previewUrl} alt={`preview-${index}`} className='h-full w-full object-cover' />
													<span className='absolute top-1 left-1 text-[8px] tracking-[0.2em]' style={{ color: '#666' }}>
														{String(index + 1).padStart(3, '0')}
													</span>
												</div>
											) : null
										)}
									</div>

									<div className='mt-3 flex items-center justify-between'>
										<span className='text-[9px] tracking-[0.2em]' style={{ color: '#555' }}>
											{'> '}
											{images.length} IMAGE{images.length > 1 ? 'S' : ''}_SELECTED
										</span>
										<button
											type='button'
											onClick={() => fileInputRef.current?.click()}
											className='border px-3 py-1.5 text-[10px] tracking-[0.2em] transition-colors hover:border-[var(--color-brand)] hover:text-white'
											style={{ borderColor }}>
											&gt; ADD_MORE
										</button>
									</div>
								</>
							)}
						</div>

						<div>
							<div className='mb-2 text-[9px] tracking-[0.35em]' style={labelStyle}>
								{'// '}DESCRIPTION <span style={dimStyle}>[OPTIONAL]</span>
							</div>
							<textarea
								value={description}
								onChange={e => setDescription(e.target.value)}
								placeholder='> 这组图片的说明...'
								className='w-full border bg-transparent px-3 py-2 text-sm tracking-[0.08em] text-white outline-none transition-colors placeholder:text-gray-600'
								style={{ borderColor }}
								rows={3}
							/>
						</div>

						<div className='flex gap-3'>
							<button
								type='button'
								onClick={() => beginExit(true)}
								className='flex-1 border px-4 py-2 text-xs tracking-[0.15em] transition-colors hover:border-[var(--color-brand)] hover:text-white'
								style={{ borderColor, color: '#666' }}>
								&gt; 取消
							</button>
							<button
								type='button'
								onClick={handleSubmit}
								className='flex-1 px-4 py-2 text-xs tracking-[0.15em] transition-colors hover:opacity-80'
								style={{ border: '1px solid var(--color-brand)', color: 'var(--color-brand)' }}>
								&gt; 确认上传
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>,
		document.body
	)
}
