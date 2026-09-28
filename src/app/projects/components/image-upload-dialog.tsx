'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { DialogModal } from '@/components/dialog-modal'
import { EDGE_CLASS, EDGE_ORDER, useEdgeFlyIn } from './use-edge-fly-in'

export type ImageItem = { type: 'url'; url: string } | { type: 'file'; file: File; previewUrl: string; hash?: string }

interface ImageUploadDialogProps {
	currentImage?: string
	onClose: () => void
	onSubmit: (image: ImageItem) => void
}

// 与 create-dialog 同一套终端风：直角、透明底、描边 hover/focus 转紫
const inputClass =
	'w-full border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm tracking-[0.08em] outline-none transition-colors placeholder:text-gray-600 hover:border-[var(--color-brand)] focus:border-[var(--color-brand)]'

const labelStyle = { color: '#444' }
const dimStyle = { color: '#3a3a3a' }

// 面板与遮罩的淡出节奏
const FADE_OUT_DELAY = 90
const FADE_OUT_MS = 260

export default function ImageUploadDialog({ currentImage, onClose, onSubmit }: ImageUploadDialogProps) {
	const [urlInput, setUrlInput] = useState(currentImage || '')
	const [previewFile, setPreviewFile] = useState<{ file: File; previewUrl: string } | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	// 遮罩层由 DialogModal 渲染、是面板的兄弟节点，只能按类名取到
	const getOverlay = () => document.querySelector<HTMLElement>('.image-picker-overlay')

	// 四边飞入／飞出与面板淡入淡出：与 create-dialog 复用同一份实现
	const { exiting, dialogRef, contentRef, edgeRefs, beginExit } = useEdgeFlyIn(onClose, {
		extraDelayMs: FADE_OUT_DELAY,
		onExitStart: () => {
			const timing = { duration: FADE_OUT_MS, delay: FADE_OUT_DELAY, easing: 'ease', fill: 'forwards' } as const
			// 只淡出遮罩的黑色压暗，不做 backdrop-filter：它会成为 fixed 后代的包含块，
			// 把全屏的网格/光标层整体挪位，还会把上一级弹窗的紫色边框糊成光晕
			getOverlay()?.animate([{ opacity: 1 }, { opacity: 0 }], timing)
		}
	})

	// 入场交给 CSS 声明式动画（animation-fill-mode: both），不再用 WAAPI 的 fill 去"保持"终点。
	// 之前边的可见性完全依赖动画的保持状态，一旦动画被取消，边就整体消失；
	// 现在边的静息态本身可见，动画只负责叠加飞入这一程。
	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		if (!file.type.startsWith('image/')) {
			toast.error('请选择图片文件')
			return
		}

		const previewUrl = URL.createObjectURL(file)
		setPreviewFile({ file, previewUrl })
		setUrlInput('')
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (exiting) return

		if (previewFile) {
			onSubmit({
				type: 'file',
				file: previewFile.file,
				previewUrl: previewFile.previewUrl
			})
		} else if (urlInput.trim()) {
			onSubmit({
				type: 'url',
				url: urlInput.trim()
			})
		} else {
			toast.error('请上传图片或输入 URL')
			return
		}

		beginExit()
	}

	const handleClose = () => {
		beginExit()
	}

	const previewSrc = previewFile ? previewFile.previewUrl : currentImage || ''
	const canSubmit = Boolean(previewFile) || Boolean(urlInput.trim())

	return (
		// 这层 wrapper 必须存在：选图弹窗是 createPortal 出去的，DOM 上在 body 末尾，
		// 但事件沿 React 树冒泡，它仍挂在 CreateDialog 的子树里，而它落在
		// 「外层面板 stopPropagation」(L162) 与「最外层遮罩 onClick=beginExit」(L161) 之间——
		// 于是点选图弹窗的遮罩会连带把上一级一起关掉。这里在 React 树最外层截断冒泡。
		// 注意用 display:contents：不生成盒子，不影响 DialogModal 的 fixed 定位。
		<div style={{ display: 'contents' }} onClick={e => e.stopPropagation()}>
			{/* 必须带 relative：DialogModal 给面板的类名里有 `static`，四边包裹层又是面板的兄弟节点，
			    若面板不可定位，包裹层会一路上溯锚到上一级弹窗的面板（于是四条边飞到上一级的边框上）。
			    twMerge 会用这里的 relative 覆盖掉 static。 */}
			<DialogModal open onClose={handleClose} className='hud-dialog relative' overlayClassName='image-picker-overlay bg-black/80!' blurBackdrop={false}>
				{/* 四边边框：与 create-dialog 复用 useEdgeFlyIn，动效完全同款 */}
				<div ref={dialogRef} className='pointer-events-none absolute inset-0 z-10'>
					{EDGE_ORDER.map((edge, i) => (
						<div
							key={edge}
							ref={el => {
								edgeRefs.current[i] = el
							}}
							className={EDGE_CLASS[edge]}
							style={{ backgroundColor: 'var(--color-brand)' }}
						/>
					))}
				</div>

				{/* 不用 .card：.hud-dialog .card 会用 !important 把内边距压成 1.75rem/0，
			    这里改用 image-picker-body 自带 p-8，避免打 !important 军备竞赛 */}
				<div ref={contentRef} className='image-picker-body relative w-md max-sm:w-full' style={{ pointerEvents: exiting ? 'none' : 'auto' }}>
					<form onSubmit={handleSubmit}>
						<div className='flex items-center justify-between text-[10px] tracking-[0.3em]' style={{ color: '#666' }}>
							<span>
								{'// '}
								{urlInput || previewFile ? 'CURRENT_IMAGE' : 'SELECT_IMAGE'}
								<span style={{ animation: 'splash-blink 0.6s step-end infinite' }}>▋</span>
							</span>
							<span className='text-[9px]' style={dimStyle}>
								PICKER://IMAGE
							</span>
						</div>

						<div className='mt-7 space-y-6 border-t pt-6' style={{ borderColor: 'var(--color-border)' }}>
							<div>
								<div className='mb-2 text-[9px] tracking-[0.35em]' style={labelStyle}>
									{'// '}UPLOAD <span style={dimStyle}>[CLICK_TO_SELECT]</span>
								</div>
								<input ref={fileInputRef} type='file' accept='image/*' className='hidden' onChange={handleFileSelect} />
								<div
									onClick={() => fileInputRef.current?.click()}
									className='group relative mx-auto flex h-36 w-36 cursor-pointer items-center justify-center border border-[var(--color-border)] transition-colors hover:border-[var(--color-brand)] max-sm:h-28 max-sm:w-28'>
									{previewSrc ? (
										<>
											<img src={previewSrc} alt='预览' className='h-full w-full object-cover' />
											<div className='pointer-events-none absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity group-hover:opacity-100'>
												<span className='text-[10px] tracking-[0.2em]' style={{ color: '#fff' }}>
													更换
												</span>
											</div>
										</>
									) : (
										<div className='text-center'>
											<Plus className='mx-auto mb-1 h-8 w-8' style={{ color: 'var(--color-brand)' }} />
											<p className='text-[10px] tracking-[0.15em]' style={{ color: '#666' }}>
												点击上传图片
											</p>
										</div>
									)}
								</div>
							</div>

							{/* 分隔线：用实底 #000 盖住中间那段线，而不是旧版的 bg-white 白块 */}
							<div className='flex items-center gap-3'>
								<span className='h-px flex-1' style={{ backgroundColor: 'var(--color-border)' }} />
								<span className='text-[9px] tracking-[0.3em]' style={{ color: '#3a3a3a' }}>
									OR
								</span>
								<span className='h-px flex-1' style={{ backgroundColor: 'var(--color-border)' }} />
							</div>

							<div>
								<div className='mb-2 text-[9px] tracking-[0.35em]' style={labelStyle}>
									{'// '}IMAGE_URL <span style={dimStyle}>[LINK]</span>
								</div>
								<input
									type='url'
									value={urlInput}
									onChange={e => {
										setUrlInput(e.target.value)
										if (previewFile) {
											URL.revokeObjectURL(previewFile.previewUrl)
											setPreviewFile(null)
										}
									}}
									placeholder='> https://example.com/image.png'
									className={inputClass}
									style={{ color: '#bbb' }}
								/>
							</div>

							<div className='flex gap-3'>
								<button
									type='button'
									onClick={handleClose}
									className='flex-1 border border-[var(--color-border)] px-4 py-2 text-xs tracking-[0.15em] transition-colors hover:border-[var(--color-brand)] hover:text-white'
									style={{ color: '#666' }}>
									&gt; 取消
								</button>
								<button
									type='submit'
									disabled={!canSubmit || exiting}
									className='flex-1 px-4 py-2 text-xs tracking-[0.15em] transition-colors hover:bg-[rgba(167,139,250,0.1)] disabled:cursor-not-allowed disabled:opacity-40'
									style={{ border: '1px solid var(--color-brand)', color: 'var(--color-brand)' }}>
									&gt; 确认
								</button>
							</div>
						</div>
					</form>
				</div>
			</DialogModal>
		</div>
	)
}
