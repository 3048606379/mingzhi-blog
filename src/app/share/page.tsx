'use client'

import { useEffect, useState } from 'react'
import sharesJson from './list.json'
import { HudPageHeader, HudRow, HudStars } from '@/components/hud-page'
import GridView from './grid-view'
import type { Share } from './components/share-card'
import type { LogoItem } from './components/logo-upload-dialog'
import { pushShares } from './services/push-shares'
import { useEditMode } from '@/hooks/use-edit-mode'
import { toast } from 'sonner'

const btnBase = 'border bg-transparent px-4 py-2 text-xs tracking-[0.15em] transition-colors disabled:opacity-40'

export default function SharePage() {
	const [shares, setShares] = useState<Share[]>(sharesJson as Share[])
	const [original, setOriginal] = useState<Share[]>(sharesJson as Share[])
	const [logoItems, setLogoItems] = useState<Map<string, LogoItem>>(new Map())
	const [saving, setSaving] = useState(false)
	const { isEditMode, editLabel, setIsEditMode } = useEditMode()

	useEffect(() => {
		fetch('/data/share/list.json').then(r => {
			if (r.ok) return r.json()
			return null
		}).then(data => {
			if (data && Array.isArray(data) && data.length > 0) {
				setShares(data)
				setOriginal(data)
			}
		}).catch(() => {})
	}, [])

	const handleUpdate = (share: Share, oldShare: Share, logoItem?: LogoItem) => {
		if (logoItem) {
			setLogoItems(prev => {
				const next = new Map(prev)
				next.set(oldShare.url, logoItem)
				return next
			})
		}
		setShares(prev => prev.map(s => (s.url === oldShare.url ? share : s)))
	}

	const handleDelete = (share: Share) => {
		setShares(prev => prev.filter(s => s.url !== share.url))
	}

	const handleSave = async () => {
		setSaving(true)
		try {
			await pushShares({ shares, logoItems })
			setOriginal(shares)
			setLogoItems(new Map())
			setIsEditMode(false)
		} catch (error: any) {
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setSaving(false)
		}
	}

	const handleCancel = () => {
		setShares(original)
		setLogoItems(new Map())
		setIsEditMode(false)
	}

	return (
		<>
			<div className='flex items-start justify-between gap-4'>
				<HudPageHeader title='SHARE' subtitle={`${shares.length} LINKS`} />
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
					<GridView shares={shares} isEditMode onUpdate={handleUpdate} onDelete={handleDelete} />
				</div>
			) : (
				<div className='flex flex-col'>
					{shares.map((share, i) => (
						<HudRow
							key={share.name}
							index={String(i + 1).padStart(2, '0')}
							title={share.name}
							desc={share.description}
							meta={<HudStars value={share.stars} />}
							delay={i * 60}
							href={share.url}
							external
						/>
					))}
				</div>
			)}
		</>
	)
}
