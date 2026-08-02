'use client'

import { useEffect, useState } from 'react'
import bloggersJson from './list.json'
import { HudPageHeader, HudRow, HudStars } from '@/components/hud-page'
import GridView, { type Blogger } from './grid-view'
import type { AvatarItem } from './components/avatar-upload-dialog'
import { pushBloggers } from './services/push-bloggers'
import { useEditMode } from '@/hooks/use-edit-mode'
import { toast } from 'sonner'

const btnBase = 'border bg-transparent px-4 py-2 text-xs tracking-[0.15em] transition-colors disabled:opacity-40'

export default function BloggersPage() {
	const [bloggers, setBloggers] = useState<Blogger[]>(bloggersJson as Blogger[])
	const [original, setOriginal] = useState<Blogger[]>(bloggersJson as Blogger[])
	const [avatarItems, setAvatarItems] = useState<Map<string, AvatarItem>>(new Map())
	const [saving, setSaving] = useState(false)
	const { isEditMode, editLabel, setIsEditMode } = useEditMode()

	useEffect(() => {
		fetch('/data/bloggers/list.json').then(r => {
			if (r.ok) return r.json()
			return null
		}).then(data => {
			if (data && Array.isArray(data) && data.length > 0) {
				setBloggers(data)
				setOriginal(data)
			}
		}).catch(() => {})
	}, [])

	const handleUpdate = (blogger: Blogger, oldBlogger: Blogger, avatarItem?: AvatarItem) => {
		if (avatarItem) {
			setAvatarItems(prev => {
				const next = new Map(prev)
				next.set(oldBlogger.url, avatarItem)
				return next
			})
		}
		setBloggers(prev => prev.map(b => (b.url === oldBlogger.url ? blogger : b)))
	}

	const handleDelete = (blogger: Blogger) => {
		setBloggers(prev => prev.filter(b => b.url !== blogger.url))
	}

	const handleSave = async () => {
		setSaving(true)
		try {
			await pushBloggers({ bloggers, avatarItems })
			setOriginal(bloggers)
			setAvatarItems(new Map())
			setIsEditMode(false)
		} catch (error: any) {
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setSaving(false)
		}
	}

	const handleCancel = () => {
		setBloggers(original)
		setAvatarItems(new Map())
		setIsEditMode(false)
	}

	return (
		<>
			<div className='flex items-start justify-between gap-4'>
				<HudPageHeader title='BLOGGERS' subtitle={`${bloggers.length} SITES`} />
				<div className='flex items-center gap-2 pt-1'>
					{isEditMode && (
						<>
							<span className='text-[9px] tracking-[0.3em]' style={{ color: 'var(--color-brand)', animation: 'hud-row-in 0.3s ease both' }}>
								· {editLabel}
								<span style={{ animation: 'splash-blink 0.6s step-end infinite' }}>▋</span>
							</span>
							<button
								className={`${btnBase} hover:border-[var(--color-brand)] hover:text-white`}
								style={{ borderColor: 'var(--color-border)', color: '#888', animation: 'hud-row-in 0.3s ease 0.1s both' }}
								onClick={handleCancel}
								disabled={saving}>
								&gt; 取消
							</button>
							<button
								className={`${btnBase} hover:bg-[rgba(167,139,250,0.1)]`}
								style={{ borderColor: 'var(--color-brand)', color: 'var(--color-brand)', animation: 'hud-row-in 0.3s ease 0.18s both' }}
								onClick={handleSave}
								disabled={saving}>
								&gt; {saving ? '保存中...' : '保存'}
							</button>
						</>
					)}
				</div>
			</div>

			{isEditMode ? (
				<div style={{ animation: 'hud-row-in 0.4s ease both' }}>
					<GridView bloggers={bloggers} isEditMode onUpdate={handleUpdate} onDelete={handleDelete} />
				</div>
			) : (
				<div className='flex flex-col'>
					{bloggers.map((blogger, i) => (
						<HudRow
							key={blogger.name}
							index={String(i + 1).padStart(2, '0')}
							title={blogger.name}
							desc={blogger.description}
							meta={<HudStars value={blogger.stars} />}
							delay={i * 60}
							href={blogger.url}
							external
						/>
					))}
				</div>
			)}
		</>
	)
}
