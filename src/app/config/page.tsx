'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { pushSiteContent } from '@/app/(home)/services/push-site-content'
import type { SiteContent } from '@/app/(home)/stores/config-store'
import { SiteSettings, type FileItem, type ArtImageUploads, type SocialButtonImageUploads } from '@/app/(home)/config-dialog/site-settings'
import { ColorConfig } from '@/app/(home)/config-dialog/color-config'
import { LoginModal } from '@/components/login-modal'
import { useTransitionNavigate } from '@/hooks/use-page-transition'

type TabType = 'site' | 'color'

const btnBase = 'border bg-transparent px-4 py-2 text-xs tracking-[0.15em] transition-colors disabled:opacity-40'
const btnStyle = { borderColor: 'var(--color-border)', color: '#888' }

export default function ConfigPage() {
	const { isAuth, login } = useAuthStore()
	const { siteContent, cardStyles, setSiteContent } = useConfigStore()
	const [formData, setFormData] = useState<SiteContent>({ ...siteContent } as SiteContent)
	const [originalData, setOriginalData] = useState<SiteContent>({ ...siteContent } as SiteContent)
	const [isSaving, setIsSaving] = useState(false)
	const [activeTab, setActiveTab] = useState<TabType>('site')
	const [showLogin, setShowLogin] = useState(false)
	const [faviconItem, setFaviconItem] = useState<FileItem | null>(null)
	const [avatarItem, setAvatarItem] = useState<FileItem | null>(null)
	const [artImageUploads, setArtImageUploads] = useState<ArtImageUploads>({})
	const [socialButtonImageUploads, setSocialButtonImageUploads] = useState<SocialButtonImageUploads>({})
	const navigate = useTransitionNavigate()

	useEffect(() => {
		const current = { ...siteContent } as SiteContent
		setFormData(current)
		setOriginalData(current)
	}, [])

	useEffect(() => {
		return () => {
			if (faviconItem?.type === 'file') URL.revokeObjectURL(faviconItem.previewUrl)
			if (avatarItem?.type === 'file') URL.revokeObjectURL(avatarItem.previewUrl)
			Object.values(artImageUploads).forEach(item => {
				if (item.type === 'file') URL.revokeObjectURL(item.previewUrl)
			})
			Object.values(socialButtonImageUploads).forEach(item => {
				if (item.type === 'file') URL.revokeObjectURL(item.previewUrl)
			})
		}
	}, [faviconItem, avatarItem, artImageUploads, socialButtonImageUploads])

	const handleSave = async () => {
		setIsSaving(true)
		try {
			const originalArtImages = originalData.artImages ?? []
			const currentArtImages = formData.artImages ?? []
			const removedArtImages = originalArtImages.filter(orig => !currentArtImages.some(current => current.id === orig.id))

			await pushSiteContent(formData, cardStyles as any, faviconItem, avatarItem, artImageUploads, removedArtImages, undefined, undefined, socialButtonImageUploads)
			setSiteContent(formData)
			updateThemeVariables(formData.theme)
			setFaviconItem(null)
			setAvatarItem(null)
			setArtImageUploads({})
			setSocialButtonImageUploads({})
			navigate('/')
		} catch (error: any) {
			console.error('Failed to save:', error)
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const handleLoginAndSave = async (password: string) => {
		const ok = await login(password)
		if (ok) {
			setShowLogin(false)
			await handleSave()
		}
		return ok
	}

	const handleSaveClick = () => {
		if (!isAuth) {
			setShowLogin(true)
		} else {
			handleSave()
		}
	}

	const revokeAll = () => {
		if (faviconItem?.type === 'file') URL.revokeObjectURL(faviconItem.previewUrl)
		if (avatarItem?.type === 'file') URL.revokeObjectURL(avatarItem.previewUrl)
		Object.values(artImageUploads).forEach(item => {
			if (item.type === 'file') URL.revokeObjectURL(item.previewUrl)
		})
		Object.values(socialButtonImageUploads).forEach(item => {
			if (item.type === 'file') URL.revokeObjectURL(item.previewUrl)
		})
	}

	const handleCancel = () => {
		revokeAll()
		setSiteContent(originalData)
		if (typeof document !== 'undefined') {
			document.title = originalData.meta.title
			const metaDescription = document.querySelector('meta[name="description"]')
			if (metaDescription) {
				metaDescription.setAttribute('content', originalData.meta.description)
			}
		}
		updateThemeVariables(originalData.theme)
		navigate('/')
	}

	const updateThemeVariables = (theme?: any) => {
		if (typeof document === 'undefined' || !theme) return
		const { colorBrand, colorBrandSecondary, colorPrimary, colorSecondary, colorBg, colorBorder, colorCard, colorArticle } = theme
		const root = document.documentElement
		if (colorBrand) root.style.setProperty('--color-brand', colorBrand)
		if (colorBrandSecondary) root.style.setProperty('--color-brand-secondary', colorBrandSecondary)
		if (colorPrimary) root.style.setProperty('--color-primary', colorPrimary)
		if (colorSecondary) root.style.setProperty('--color-secondary', colorSecondary)
		if (colorBg) root.style.setProperty('--color-bg', colorBg)
		if (colorBorder) root.style.setProperty('--color-border', colorBorder)
		if (colorCard) root.style.setProperty('--color-card', colorCard)
		if (colorArticle) root.style.setProperty('--color-article', colorArticle)
	}

	const handlePreview = () => {
		setSiteContent(formData)
		if (typeof document !== 'undefined') {
			document.title = formData.meta.title
			const metaDescription = document.querySelector('meta[name="description"]')
			if (metaDescription) metaDescription.setAttribute('content', formData.meta.description)
		}
		updateThemeVariables(formData.theme)
		navigate('/')
	}

	const buttonText = isAuth ? '保存' : '登录/保存'

	const tabs: { id: TabType; label: string }[] = [
		{ id: 'site', label: '网站设置' },
		{ id: 'color', label: '色彩配置' }
	]

	return (
		<>
			<LoginModal open={showLogin} onClose={() => setShowLogin(false)} onLogin={handleLoginAndSave} />

			<div className='flex flex-col gap-8 px-10 py-8'>
				<div className='flex items-center justify-between' style={{ animation: 'hud-row-in 0.4s ease both' }}>
				<div className='flex items-baseline gap-4'>
					<span className='text-[9px] tracking-[0.35em]' style={{ color: '#444' }}>
						{'// CONFIG'}
					</span>
					<div className='relative flex items-baseline gap-0'>
						{tabs.map((tab, i) => (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className='group relative flex items-baseline gap-1.5 px-3 py-2 text-xs tracking-[0.15em] transition-colors'
								style={{ color: activeTab === tab.id ? 'var(--color-brand)' : '#666' }}>
								<span className='text-[9px] transition-colors duration-300' style={{ color: activeTab === tab.id ? 'var(--color-brand)' : '#3a3a3a' }}>
									{String(i + 1).padStart(2, '0')}
								</span>
								<span className='transition-colors duration-300 group-hover:text-white' style={{ color: activeTab === tab.id ? 'var(--color-brand)' : undefined }}>
									{tab.label}
								</span>
							</button>
						))}
						<div
							className='absolute bottom-0 h-px transition-all duration-300 ease-out'
							style={{
								left: activeTab === 'site' ? '8px' : 'calc(50% + 8px)',
								width: 'calc(50% - 16px)',
								backgroundColor: 'var(--color-brand)'
							}}
						/>
					</div>
				</div>
					<div className='flex gap-2'>
						<button className={`${btnBase} hover:border-[var(--color-brand)] hover:text-white`} style={btnStyle} onClick={handlePreview}>
							&gt; 预览
						</button>
						<button className={`${btnBase} hover:border-[var(--color-brand)] hover:text-white`} style={btnStyle} onClick={handleCancel} disabled={isSaving}>
							&gt; 取消
						</button>
						<button
							className={`${btnBase} hover:bg-[rgba(167,139,250,0.1)]`}
							style={{ borderColor: 'var(--color-brand)', color: 'var(--color-brand)' }}
							onClick={handleSaveClick}
							disabled={isSaving}>
							&gt; {isSaving ? '保存中...' : buttonText}
						</button>
					</div>
				</div>

			<div className='hud-skin min-h-[200px]'>
				<div key={activeTab} style={{ animation: 'hud-row-in 0.4s ease both' }}>
					{activeTab === 'site' && (
						<SiteSettings
							formData={formData}
							setFormData={setFormData}
							faviconItem={faviconItem}
							setFaviconItem={setFaviconItem}
							avatarItem={avatarItem}
							setAvatarItem={setAvatarItem}
							artImageUploads={artImageUploads}
							setArtImageUploads={setArtImageUploads}
							socialButtonImageUploads={socialButtonImageUploads}
							setSocialButtonImageUploads={setSocialButtonImageUploads}
						/>
					)}
					{activeTab === 'color' && <ColorConfig formData={formData} setFormData={setFormData} />}
				</div>
			</div>
			</div>
		</>
	)
}
