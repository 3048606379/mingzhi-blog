import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useWriteStore } from '../stores/write-store'
import { usePreviewStore } from '../stores/preview-store'
import { usePublish } from '../hooks/use-publish'
import { LoginModal } from '@/components/login-modal'

const btnBase = 'border bg-transparent px-4 py-2 text-xs tracking-[0.15em] transition-colors disabled:opacity-40'
const btnStyle = { borderColor: 'var(--color-border)', color: '#888' }

export function WriteActions() {
	const { loading, mode, form, originalSlug, updateForm } = useWriteStore()
	const { openPreview } = usePreviewStore()
	const { isAuth, login, onPublish, onDelete } = usePublish()
	const [showLogin, setShowLogin] = useState(false)
	const router = useRouter()

	const handlePublish = async (password: string) => {
		const ok = await login(password)
		if (ok) {
			setShowLogin(false)
			onPublish()
		}
		return ok
	}

	const handlePublishClick = () => {
		if (!isAuth) {
			setShowLogin(true)
		} else {
			onPublish()
		}
	}

	const handleCancel = () => {
		if (!window.confirm('放弃本次修改吗？')) return
		if (mode === 'edit' && originalSlug) {
			router.push(`/blog/${originalSlug}`)
		} else {
			router.push('/')
		}
	}

	const handleDelete = () => {
		if (!isAuth) {
			setShowLogin(true)
			return
		}
		const confirmMsg = form?.title ? `确定删除《${form.title}》吗？该操作不可恢复。` : '确定删除当前文章吗？该操作不可恢复。'
		if (window.confirm(confirmMsg)) {
			onDelete()
		}
	}

	const handleMdFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		try {
			const text = await file.text()
			updateForm({ md: text })
			toast.success('已导入 Markdown 文件')
		} catch {
			toast.error('导入失败，请重试')
		} finally {
			if (e.currentTarget) e.currentTarget.value = ''
		}
	}

	const isEditMode = mode === 'edit'

	return (
		<>
			<LoginModal
				open={showLogin}
				onClose={() => setShowLogin(false)}
				onLogin={handlePublish}
			/>

			<div className='flex items-center justify-between' style={{ animation: 'hud-row-in 0.4s ease both' }}>
				<div className='text-[9px] tracking-[0.35em]' style={{ color: '#444' }}>
					{isEditMode ? '// EDIT_MODE' : '// WRITE --NEW'}
				</div>

				<div className='flex items-center gap-2'>
					{isEditMode && (
						<>
							<button
								className={`${btnBase} hover:border-red-400`}
								style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#f87171' }}
								disabled={loading}
								onClick={handleDelete}>
								&gt; 删除
							</button>
							<button className={`${btnBase} hover:border-[var(--color-brand)] hover:text-white`} style={btnStyle} disabled={loading} onClick={handleCancel}>
								&gt; 取消
							</button>
						</>
					)}
					<button className={`${btnBase} hover:border-[var(--color-brand)] hover:text-white`} style={btnStyle} disabled={loading} onClick={handleCancel}>
						&gt; 返回
					</button>
					<label htmlFor='write-md-import' className={`${btnBase} cursor-pointer hover:border-[var(--color-brand)] hover:text-white`} style={btnStyle}>
						&gt; 导入 MD
						<input id='write-md-import' type='file' accept='.md' className='hidden' onChange={handleMdFileChange} />
					</label>
					<button className={`${btnBase} hover:border-[var(--color-brand)] hover:text-white`} style={btnStyle} disabled={loading} onClick={openPreview}>
						&gt; 预览
					</button>
					<button
						className={`${btnBase} hover:bg-[rgba(167,139,250,0.1)]`}
						style={{ borderColor: 'var(--color-brand)', color: 'var(--color-brand)' }}
						disabled={loading}
						onClick={handlePublishClick}>
						&gt; {isAuth ? (isEditMode ? '更新' : '发布') : '登录/发布'}
					</button>
				</div>
			</div>
		</>
	)
}
