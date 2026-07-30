import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'

export async function batchDeleteBlogs(slugs: string[]): Promise<void> {
	const uniqueSlugs = Array.from(new Set(slugs.filter(Boolean)))
	if (uniqueSlugs.length === 0) {
		throw new Error('需要至少选择一篇文章')
	}

	await apiFetch('/api/blogs/delete', {
		method: 'POST',
		body: JSON.stringify({ slugs: uniqueSlugs })
	})

	toast.success('删除成功')
}
