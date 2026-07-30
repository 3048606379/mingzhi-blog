import { useCallback } from 'react'
import { toast } from 'sonner'
import { pushBlog } from '../services/push-blog'
import { deleteBlog } from '../services/delete-blog'
import { useWriteStore } from '../stores/write-store'
import { useAuthStore } from '@/hooks/use-auth'
import { useTransitionNavigate } from '@/hooks/use-page-transition'

export function usePublish() {
	const { loading, setLoading, form, cover, images, mode, originalSlug } = useWriteStore()
	const { isAuth, login } = useAuthStore()
	const navigate = useTransitionNavigate()

	const onPublish = useCallback(async () => {
		try {
			setLoading(true)
			await pushBlog({
				form,
				cover,
				images,
				mode,
				originalSlug
			})
			toast.success(mode === 'edit' ? '更新成功' : '发布成功')
			navigate(`/blog/${form.slug}`)
		} catch (err: any) {
			console.error(err)
			toast.error(err?.message || '操作失败')
		} finally {
			setLoading(false)
		}
	}, [form, cover, images, mode, originalSlug, setLoading, navigate])

	const onDelete = useCallback(async () => {
		const targetSlug = originalSlug || form.slug
		if (!targetSlug) {
			toast.error('缺少 slug，无法删除')
			return
		}
		try {
			setLoading(true)
			await deleteBlog(targetSlug)
			toast.success('删除成功')
			navigate('/blog')
		} catch (err: any) {
			console.error(err)
			toast.error(err?.message || '删除失败')
		} finally {
			setLoading(false)
		}
	}, [form.slug, originalSlug, setLoading, navigate])

	return {
		isAuth,
		login,
		loading,
		onPublish,
		onDelete
	}
}
