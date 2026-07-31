'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import initialList from './list.json'
import { HudGallery } from './components/hud-gallery'
import UploadDialog from './components/upload-dialog'
import { pushPictures } from './services/push-pictures'
import { LoginModal } from '@/components/login-modal'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import type { ImageItem } from '../projects/components/image-upload-dialog'
import { useRouter } from 'next/navigation'

const btnBase = 'border bg-transparent px-4 py-2 text-xs tracking-[0.15em] transition-colors disabled:opacity-40'
const btnStyle = { borderColor: 'var(--color-border)', color: '#888' }

export interface Picture {
	id: string
	uploadedAt: string
	description?: string
	image?: string
	images?: string[]
}

export default function Page() {
	const [pictures, setPictures] = useState<Picture[]>(initialList as Picture[])
	const [originalPictures, setOriginalPictures] = useState<Picture[]>(initialList as Picture[])
	const [isEditMode, setIsEditMode] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
	const [imageItems, setImageItems] = useState<Map<string, ImageItem>>(new Map())
	const [showLogin, setShowLogin] = useState(false)
	const [pendingAction, setPendingAction] = useState<'save' | 'delete' | null>(null)
	const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
	const [loadError, setLoadError] = useState(false)
	const [editLabel, setEditLabel] = useState('')
	const router = useRouter()

	const { isAuth, login } = useAuthStore()
	const { siteContent } = useConfigStore()
	const hideEditButton = siteContent.hideEditButton ?? false

	useEffect(() => {
		fetch('/data/pictures/list.json').then(r => {
			if (r.ok) return r.json()
			if (r.status === 404) return null
			throw new Error(`HTTP ${r.status}`)
		}).then(data => {
			if (data && Array.isArray(data) && data.length > 0) {
				setPictures(data)
				setOriginalPictures(data)
			}
		}).catch(err => {
			console.error('Failed to load pictures:', err)
			setLoadError(true)
		})
	}, [])

	const handleUploadSubmit = ({ images, description }: { images: ImageItem[]; description: string }) => {
		const now = new Date().toISOString()
		if (images.length === 0) {
			toast.error('请至少选择一张图片')
			return
		}
		const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
		const imageUrls = images.map(imageItem => (imageItem.type === 'url' ? imageItem.url : imageItem.previewUrl))
		const newPicture: Picture = { id, uploadedAt: now, description: description.trim() || undefined, images: imageUrls }
		const newMap = new Map(imageItems)
		images.forEach((imageItem, index) => {
			if (imageItem.type === 'file') newMap.set(`${id}::${index}`, imageItem)
		})
		setPictures(prev => [...prev, newPicture])
		setImageItems(newMap)
		setIsUploadDialogOpen(false)
	}

	const handleDeleteSingleImage = (pictureId: string, imageIndex: number | 'single') => {
		setPictures(prev => {
			return prev.map(picture => {
				if (picture.id !== pictureId) return picture
				if (imageIndex === 'single') return null
				if (picture.images && picture.images.length > 0) {
					const newImages = picture.images.filter((_, idx) => idx !== imageIndex)
					if (newImages.length === 0) return null
					return { ...picture, images: newImages }
				}
				return picture
			}).filter((p): p is Picture => p !== null)
		})
		setImageItems(prev => {
			const next = new Map(prev)
			for (const key of next.keys()) {
				if (key.startsWith(`${pictureId}::`)) next.delete(key)
			}
			return next
		})
	}

	const handleDeleteGroup = (picture: Picture) => {
		if (!confirm('确定要删除这一组图片吗？')) return
		setPictures(prev => prev.filter(p => p.id !== picture.id))
		setImageItems(prev => {
			const next = new Map(prev)
			for (const key of next.keys()) {
				if (key.startsWith(`${picture.id}::`)) next.delete(key)
			}
			return next
		})
	}

	const handleSave = async () => {
		setIsSaving(true)
		try {
			await pushPictures({ pictures, imageItems })
			setOriginalPictures(pictures)
			setImageItems(new Map())
			setIsEditMode(false)
			toast.success('保存成功！')
		} catch (error: any) {
			console.error('Failed to save:', error)
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const handleLoginAndAction = async (password: string) => {
		const ok = await login(password)
		if (ok) {
			setShowLogin(false)
			if (pendingAction === 'save') {
				setPendingAction(null)
				await handleSave()
			}
		}
		return ok
	}

	const handleSaveClick = () => {
		if (!isAuth) {
			setPendingAction('save')
			setShowLogin(true)
		} else {
			handleSave()
		}
	}

	const handleCancel = () => {
		setPictures(originalPictures)
		setImageItems(new Map())
		setIsEditMode(false)
	}

	useEffect(() => {
		if (!isEditMode) {
			setEditLabel('')
			return
		}
		const label = 'EDIT_MODE'
		let i = 0
		const timer = setInterval(() => {
			i++
			setEditLabel(label.slice(0, i))
			if (i >= label.length) clearInterval(timer)
		}, 35)
		return () => clearInterval(timer)
	}, [isEditMode])

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isEditMode && (e.ctrlKey || e.metaKey) && e.key === ',') {
				e.preventDefault()
				setIsEditMode(true)
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isEditMode])

	const buttonText = isAuth ? '保存' : '登录/保存'

	return (
		<>
			<LoginModal open={showLogin} onClose={() => setShowLogin(false)} onLogin={handleLoginAndAction} />

			<div className='flex flex-col gap-8 px-10 py-8'>
				<div className='flex items-center justify-between' style={{ animation: 'hud-row-in 0.4s ease both' }}>
					<div className='text-[9px] tracking-[0.35em]' style={{ color: '#444' }}>
						{'// PICTURES'} · {pictures.length} GROUPS
						{isEditMode && (
							<span style={{ color: 'var(--color-brand)' }}>
								{' '}· {editLabel}
								<span style={{ animation: 'splash-blink 0.6s step-end infinite' }}>▋</span>
							</span>
						)}
					</div>
					<div
						className='flex items-center gap-2 max-sm:hidden'
						style={
							isEditMode
								? { paddingLeft: 24, animation: 'hud-buttons-enable 0.36s ease' }
								: undefined
						}>
						{isEditMode ? (
							<>
								<button
									className={`${btnBase} hover:border-[var(--color-brand)] hover:text-white`}
									style={{ ...btnStyle, animation: 'hud-row-in 0.4s ease 0.05s both' }}
									onClick={() => router.push('/image-toolbox')}>
									&gt; 压缩工具
								</button>
								<button
									className={`${btnBase} hover:border-[var(--color-brand)] hover:text-white`}
									style={{ ...btnStyle, animation: 'hud-row-in 0.4s ease 0.12s both' }}
									onClick={handleCancel}
									disabled={isSaving}>
									&gt; 取消
								</button>
								<button
									className={`${btnBase} hover:border-[var(--color-brand)] hover:text-white`}
									style={{ ...btnStyle, animation: 'hud-row-in 0.4s ease 0.19s both' }}
									onClick={() => setIsUploadDialogOpen(true)}>
									&gt; 上传
								</button>
								<button
									className={`${btnBase} hover:bg-[rgba(167,139,250,0.1)]`}
									style={{
										borderColor: 'var(--color-brand)',
										color: 'var(--color-brand)',
										animation: 'hud-row-in 0.4s ease 0.26s both'
									}}
									onClick={handleSaveClick}
									disabled={isSaving}>
									&gt; {isSaving ? '保存中...' : buttonText}
								</button>
							</>
						) : (
							!hideEditButton && (
								<button className={`${btnBase} hover:border-[var(--color-brand)] hover:text-white`} style={btnStyle} onClick={() => setIsEditMode(true)}>
									&gt; 编辑
								</button>
							)
						)}
					</div>
				</div>

				{pictures.length === 0 ? (
					<div className='flex min-h-[50vh] items-center justify-center text-xs tracking-[0.2em]' style={{ color: '#555' }}>
						{loadError
							? '> 加载图片数据失败，请刷新页面重试'
							: '> 暂无图片，点击右上角「编辑」开始上传'
						}
					</div>
				) : (
					<HudGallery pictures={pictures} isEditMode={isEditMode} onDeleteSingle={handleDeleteSingleImage} onDeleteGroup={handleDeleteGroup} />
				)}

				{isUploadDialogOpen && <UploadDialog onClose={() => setIsUploadDialogOpen(false)} onSubmit={handleUploadSubmit} />}
			</div>
		</>
	)
}
