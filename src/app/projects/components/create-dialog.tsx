'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import ImageUploadDialog, { type ImageItem } from './image-upload-dialog'
import { EDGE_CLASS, EDGE_ORDER, useEdgeFlyIn } from './use-edge-fly-in'
import type { Project } from './project-card'

interface CreateDialogProps {
	project: Project | null
	onClose: () => void
	onSave: (project: Project) => void
}

const EASE_OUT = 'cubic-bezier(0.55, 0, 1, 0.45)'

const labelStyle = { color: '#444' }
const dimStyle = { color: '#3a3a3a' }
const borderColor = 'var(--color-border)'
const edgeColor = 'var(--color-brand)'

const inputClass =
	'w-full border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm tracking-[0.08em] outline-none transition-colors placeholder:text-gray-600 hover:border-[var(--color-brand)] focus:border-[var(--color-brand)]'

// 校验未过时的边框/文字色，与站内删除按钮、错误提示同一套红
const invalidBorder = '#f87171'

// 边框只用行内样式表达「校验未过」这一种额外状态；常态描边、hover、focus 全部交给样式表，
// 否则行内样式优先级高于 class，会盖掉 hover / focus 的紫色反馈
const fieldStyle = (invalid = false) => ({
	color: '#bbb',
	...(invalid ? { borderColor: invalidBorder } : {})
})

type InvalidField = 'name' | 'image' | 'url' | 'description' | 'tags'

export default function CreateDialog({ project, onClose, onSave }: CreateDialogProps) {
	const [formData, setFormData] = useState<Project>({
		name: '',
		year: new Date().getFullYear(),
		image: '',
		url: '',
		description: '',
		tags: [],
		github: undefined,
		npm: undefined
	})
	const [showImageDialog, setShowImageDialog] = useState(false)
	const [tagsInput, setTagsInput] = useState('')
	const [invalid, setInvalid] = useState<InvalidField[]>([])
	const dialogRef = useRef<HTMLDivElement>(null)
	const iconBoxRef = useRef<HTMLDivElement>(null)
	const nameInputRef = useRef<HTMLInputElement>(null)
	const urlInputRef = useRef<HTMLInputElement>(null)
	const descInputRef = useRef<HTMLTextAreaElement>(null)
	const tagInputRef = useRef<HTMLInputElement>(null)

	// 四边飞入／飞出、内容淡入淡出、以及退场后的关闭时机，全部复用与选图弹窗共用的那套实现
	const { exiting, mounted, contentRef, edgeRefs, beginExit } = useEdgeFlyIn(onClose, {
		onExitStart: () => {
			// 自己的黑色底随退场一起淡开，露出背后的选图弹窗或页面
			dialogRef.current?.animate([{ backgroundColor: 'rgba(0, 0, 0, 1)' }, { backgroundColor: 'rgba(0, 0, 0, 0)' }], {
				duration: 650,
				easing: 'ease',
				fill: 'both'
			})
		}
	})

	const fieldRefs = {
		name: nameInputRef,
		url: urlInputRef,
		description: descInputRef,
		image: iconBoxRef
	} as const satisfies Record<Exclude<InvalidField, 'tags'>, React.RefObject<HTMLElement | null>>

	const isInvalid = (field: InvalidField) => invalid.includes(field)
	const clearInvalid = (field: InvalidField) => setInvalid(prev => (prev.includes(field) ? prev.filter(f => f !== field) : prev))

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && !exiting) beginExit()
		}
		window.addEventListener('keydown', handler)
		return () => window.removeEventListener('keydown', handler)
	}, [exiting])

	useEffect(() => {
		if (project) {
			setFormData(project)
			setTagsInput(project.tags.join(', '))
		} else {
			setFormData({
				name: '',
				year: new Date().getFullYear(),
				image: '',
				url: '',
				description: '',
				tags: [],
				github: undefined,
				npm: undefined
			})
			setTagsInput('')
		}
		setInvalid([])
	}, [project])

	const handleImageSubmit = (image: ImageItem) => {
		const imageUrl = image.type === 'url' ? image.url : image.previewUrl
		setFormData({ ...formData, image: imageUrl })
		clearInvalid('image')
	}

	const handleTagsChange = (value: string) => {
		setTagsInput(value)
		const tags = value
			.split(',')
			.map(t => t.trim())
			.filter(t => t)
		setFormData({ ...formData, tags })
		if (tags.length > 0) clearInvalid('tags')
	}

	const handleSubmit = () => {
		const missing: { field: InvalidField; label: string }[] = []
		if (!formData.name.trim()) missing.push({ field: 'name', label: '名称' })
		if (!formData.image.trim()) missing.push({ field: 'image', label: '图标' })
		if (!formData.url.trim()) missing.push({ field: 'url', label: '网址' })
		if (!formData.description.trim()) missing.push({ field: 'description', label: '介绍' })
		if (formData.tags.length === 0) missing.push({ field: 'tags', label: '标签' })

		setInvalid(missing.map(m => m.field))

		if (missing.length > 0) {
			const [first, ...rest] = missing
			toast.error(rest.length === 0 ? `缺少必填项：${first.label}` : `还缺 ${missing.length} 项：${missing.map(m => m.label).join('、')}`)
			// 图标不是输入框，抢焦点没意义：优先聚焦第一个可输入项，若只缺图标则把图标滚进视野
			const typable = missing.find(m => m.field !== 'image')
			const el = typable ? (typable.field === 'tags' ? tagInputRef.current : fieldRefs[typable.field].current) : iconBoxRef.current
			if (el) {
				el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
				el.focus({ preventScroll: true })
			}
			return
		}

		onSave(formData)
		beginExit()
		if (project) {
			toast.success('更新成功')
		} else {
			toast.warning('已加入列表，修改未保存，点右上角保存生效', { id: 'projects-unsaved' })
		}
	}

	if (!mounted) return null

	return createPortal(
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4' style={{ pointerEvents: exiting ? 'none' : 'auto' }} onClick={beginExit}>
			<div ref={dialogRef} className='projects-create-dialog relative w-lg overflow-visible bg-black max-sm:w-full' onClick={e => e.stopPropagation()}>
				<div className='pointer-events-none absolute inset-0 z-10'>
					{EDGE_ORDER.map((edge, i) => (
						<div
							key={edge}
							ref={el => {
								edgeRefs.current[i] = el
							}}
							className={EDGE_CLASS[edge]}
							style={{ backgroundColor: edgeColor }}
						/>
					))}
				</div>

				<div ref={contentRef} className='p-8 max-sm:p-5'>
					<div className='flex items-center justify-between text-[10px] tracking-[0.3em]' style={{ color: '#666' }}>
						<span>
							{'// '}
							{project ? 'EDIT_PROJECT' : 'ADD_PROJECT'}
							<span style={{ animation: 'splash-blink 0.6s step-end infinite' }}>▋</span>
						</span>
						<span className='text-[9px]' style={dimStyle}>
							PROJECTS://{project ? 'EDIT' : 'NEW'}
						</span>
					</div>

					<div className='mt-7 space-y-6 border-t pt-6' style={{ borderColor }}>
						{/* 名称单独占一整行：给它足够宽度，长项目名不再被图标挤 */}
						<div>
							<div className='mb-2 text-[9px] tracking-[0.35em]' style={labelStyle}>
								{'// '}NAME <span style={dimStyle}>[REQUIRED]</span>
							</div>
							<input
								ref={nameInputRef}
								type='text'
								value={formData.name}
								onChange={e => {
									setFormData({ ...formData, name: e.target.value })
									clearInvalid('name')
								}}
								placeholder='> 项目名称'
								aria-invalid={isInvalid('name')}
								className={inputClass}
								style={fieldStyle(isInvalid('name'))}
							/>
						</div>

						<div>
							<div className='mb-2 text-[9px] tracking-[0.35em]' style={labelStyle}>
								{'// '}URL <span style={isInvalid('url') ? { color: invalidBorder } : dimStyle}>[REQUIRED]</span>
							</div>
							<input
								ref={urlInputRef}
								type='url'
								value={formData.url}
								onChange={e => {
									setFormData({ ...formData, url: e.target.value })
									clearInvalid('url')
								}}
								placeholder='> https://...'
								aria-invalid={isInvalid('url')}
								className={inputClass}
								style={fieldStyle(isInvalid('url'))}
							/>
						</div>

						{/* 图标与年份并排：图标是 4rem 方块、年份撑满剩余宽度，两个标签同处一行 */}
						<div className='flex items-start gap-4'>
							<div className='shrink-0'>
								<div className='mb-2 text-[9px] tracking-[0.35em]' style={labelStyle}>
									{'// '}ICON <span style={isInvalid('image') ? { color: invalidBorder } : dimStyle}>[REQUIRED]</span>
								</div>
								<div
									ref={iconBoxRef}
									tabIndex={0}
									aria-invalid={isInvalid('image')}
									className='group relative h-16 w-16 cursor-pointer border transition-colors outline-none hover:border-[var(--color-brand)] focus:border-[var(--color-brand)]'
									style={fieldStyle(isInvalid('image'))}
									onClick={() => setShowImageDialog(true)}>
									{formData.image ? (
										<>
											<img src={formData.image} alt={formData.name} className='h-full w-full object-cover' />
											<div className='pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100'>
												<span className='text-[10px] tracking-[0.2em]' style={{ color: '#fff' }}>
													更换
												</span>
											</div>
										</>
									) : (
										<div className='flex h-full w-full items-center justify-center'>
											<Plus className='h-6 w-6' style={{ color: 'var(--color-brand)' }} />
										</div>
									)}
									{isInvalid('image') && (
										// 叠在图标盒下方，不占额外高度、不把年份输入框顶歪
										<span
											className='pointer-events-none absolute inset-x-0 top-full mt-1 text-center text-[9px] tracking-[0.1em] whitespace-nowrap'
											style={{ color: invalidBorder }}>
											缺必填
										</span>
									)}
								</div>
							</div>

							<div className='flex-1'>
								<div className='mb-2 text-[9px] tracking-[0.35em]' style={labelStyle}>
									{'// '}YEAR <span style={dimStyle}>[OPT]</span>
								</div>
								<input
									type='number'
									value={formData.year}
									onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
									placeholder='2026'
									className={`${inputClass} max-w-40`}
									style={{ color: '#bbb' }}
								/>
							</div>
						</div>

						<div>
							<div className='mb-2 text-[9px] tracking-[0.35em]' style={labelStyle}>
								{'// '}TAGS <span style={isInvalid('tags') ? { color: invalidBorder } : dimStyle}>[REQUIRED · COMMA_SEPARATED]</span>
							</div>
							<input
								ref={tagInputRef}
								type='text'
								value={tagsInput}
								onChange={e => handleTagsChange(e.target.value)}
								placeholder='> React, Vue, Next.js'
								aria-invalid={isInvalid('tags')}
								className={inputClass}
								style={fieldStyle(isInvalid('tags'))}
							/>
							<div className='mt-2 flex flex-wrap gap-1.5'>
								{formData.tags.map(tag => (
									<span
										key={tag}
										className='px-2 py-0.5 text-[10px] tracking-[0.15em]'
										style={{ color: 'var(--color-brand)', border: `1px solid ${borderColor}`, backgroundColor: 'rgba(167,139,250,0.06)' }}>
										{tag}
									</span>
								))}
							</div>
						</div>

						<div>
							<div className='mb-2 text-[9px] tracking-[0.35em]' style={labelStyle}>
								{'// '}DESCRIPTION <span style={isInvalid('description') ? { color: invalidBorder } : dimStyle}>[REQUIRED]</span>
							</div>
							<textarea
								ref={descInputRef}
								value={formData.description}
								onChange={e => {
									setFormData({ ...formData, description: e.target.value })
									clearInvalid('description')
								}}
								placeholder='> 项目介绍...'
								aria-invalid={isInvalid('description')}
								className={`${inputClass} resize-none`}
								style={fieldStyle(isInvalid('description'))}
								rows={4}
							/>
						</div>

						<div>
							<div className='mb-2 text-[9px] tracking-[0.35em]' style={labelStyle}>
								{'// '}LINKS <span style={dimStyle}>[OPTIONAL]</span>
							</div>
							<div className='space-y-2'>
								<input
									type='url'
									value={formData.github || ''}
									onChange={e => setFormData({ ...formData, github: e.target.value || undefined })}
									placeholder='> GitHub URL'
									className={inputClass}
									style={{ color: '#bbb' }}
								/>
								<input
									type='url'
									value={formData.npm || ''}
									onChange={e => setFormData({ ...formData, npm: e.target.value || undefined })}
									placeholder='> NPM URL'
									className={inputClass}
									style={{ color: '#bbb' }}
								/>
							</div>
						</div>

						<div className='flex gap-3'>
							<button
								type='button'
								onClick={beginExit}
								className='flex-1 border border-[var(--color-border)] px-4 py-2 text-xs tracking-[0.15em] transition-colors hover:border-[var(--color-brand)] hover:text-white'
								style={{ color: '#666' }}>
								&gt; 取消
							</button>
							<button
								type='button'
								onClick={handleSubmit}
								className='flex-1 px-4 py-2 text-xs tracking-[0.15em] transition-colors hover:opacity-80'
								style={{ border: '1px solid var(--color-brand)', color: 'var(--color-brand)' }}>
								&gt; {project ? '保存更新' : '添加'}
							</button>
						</div>
					</div>
				</div>
			</div>

			{showImageDialog && <ImageUploadDialog currentImage={formData.image} onClose={() => setShowImageDialog(false)} onSubmit={handleImageSubmit} />}
		</div>,
		document.body
	)
}
