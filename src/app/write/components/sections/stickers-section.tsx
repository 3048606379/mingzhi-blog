'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'
import { useAuthStore } from '@/hooks/use-auth'
import { LoginModal } from '@/components/login-modal'
import { useWriteStore } from '../../stores/write-store'

type Sticker = {
	name: string
	url: string
}

export function StickersSection() {
	const { isAuth, login } = useAuthStore()
	const [stickers, setStickers] = useState<Sticker[]>([])
	const [loading, setLoading] = useState(true)
	const [uploading, setUploading] = useState(false)
	const [showLogin, setShowLogin] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const load = useCallback(async () => {
		setLoading(true)
		try {
			const res = await fetch('/api/stickers', { cache: 'no-store' })
			const data = await res.json()
			setStickers(Array.isArray(data.files) ? data.files : [])
		} catch {
			toast.error('表情列表加载失败')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		void load()
	}, [load])

	const upload = useCallback(
		async (files: File[]) => {
			if (files.length === 0) return
			setUploading(true)
			let ok = 0
			for (const file of files) {
				try {
					const fd = new FormData()
					fd.append('file', file)
					await apiFetch('/api/stickers', { method: 'POST', body: fd })
					ok += 1
				} catch (err: any) {
					toast.error(`${file.name}：${err?.message || '上传失败'}`)
				}
			}
			if (ok > 0) toast.success(`已上传 ${ok} 个表情`)
			setUploading(false)
			await load()
		},
		[load]
	)

	const handlePick = () => {
		if (!isAuth) {
			setShowLogin(true)
			return
		}
		fileInputRef.current?.click()
	}

	const handleLogin = async (password: string) => {
		const ok = await login(password)
		if (ok) {
			setShowLogin(false)
			toast.success('已登录，请再次点击上传')
		}
		return ok
	}

	const insertSticker = (sticker: Sticker) => {
		const textarea = useWriteStore.getState().editorRef
		if (!textarea) {
			toast.error('请先点击编辑器正文区域')
			return
		}
		const markdown = `![](${sticker.url})`
		textarea.focus()
		document.execCommand('insertText', false, markdown)
		toast.success('已插入到光标位置')
	}

	return (
		<div style={{ animation: 'hud-row-in 0.4s ease 0.22s both' }}>
			<LoginModal open={showLogin} onClose={() => setShowLogin(false)} onLogin={handleLogin} />

			<div className='flex items-center justify-between'>
				<div className='text-[9px] tracking-[0.35em]' style={{ color: '#444' }}>
					{'// STICKERS'}
				</div>
				<div className='flex items-center gap-3'>
					<button
						type='button'
						className='text-[10px] tracking-[0.1em] transition-colors hover:text-white disabled:opacity-40'
						style={{ color: '#555' }}
						disabled={loading}
						onClick={() => void load()}
						title='刷新表情列表'>
						↻
					</button>
					<button
						type='button'
						className='text-[10px] tracking-[0.1em] transition-colors hover:text-white disabled:opacity-40'
						style={{ color: '#777' }}
						disabled={uploading}
						onClick={handlePick}>
						{uploading ? '上传中…' : '+ 上传'}
					</button>
				</div>
			</div>

			<input
				ref={fileInputRef}
				type='file'
				accept='image/png,image/gif,image/jpeg,image/webp,image/avif'
				multiple
				className='hidden'
				onChange={e => {
					const files = e.target.files ? Array.from(e.target.files) : []
					if (files.length > 0) void upload(files)
					if (e.currentTarget) e.currentTarget.value = ''
				}}
			/>

			{loading ? (
				<div className='mt-3 text-[10px]' style={{ color: '#555' }}>
					&gt; loading...
				</div>
			) : stickers.length === 0 ? (
				<div
					className='mt-3 border border-dashed px-3 py-4 text-[10px] leading-relaxed'
					style={{ borderColor: '#1f1f1f', color: '#555' }}>
					暂无表情。
					<br />
					点「+ 上传」，或把图片放进服务器 public/stickers/ 后点 ↻。
				</div>
			) : (
				<div className='mt-3 grid max-h-[320px] grid-cols-4 gap-2 overflow-y-auto pr-1'>
					{stickers.map(sticker => {
						const markdown = `![](${sticker.url})`
						return (
							<button
								key={sticker.name}
								type='button'
								draggable
								className='group relative aspect-square cursor-pointer overflow-hidden border transition-colors hover:border-[var(--color-brand)]'
								style={{ borderColor: 'var(--color-border)', backgroundColor: 'rgba(255,255,255,0.02)' }}
								title='点击插入到光标处，也可以拖进正文'
								onClick={() => insertSticker(sticker)}
								onDragStart={e => {
									e.dataTransfer.setData('text/plain', markdown)
									e.dataTransfer.setData('text/markdown', markdown)
									e.dataTransfer.effectAllowed = 'copy'
								}}>
								<img src={sticker.url} alt='' className='h-full w-full object-contain' draggable={false} loading='lazy' />
							</button>
						)
					})}
				</div>
			)}
		</div>
	)
}
