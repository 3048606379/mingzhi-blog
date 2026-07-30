import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'

export async function deleteBlog(slug: string): Promise<void> {
	if (!slug) throw new Error('需要 slug')

	await apiFetch(`/api/blogs/delete?slug=${encodeURIComponent(slug)}`, {
		method: 'DELETE'
	})

	toast.success('删除成功')
}
