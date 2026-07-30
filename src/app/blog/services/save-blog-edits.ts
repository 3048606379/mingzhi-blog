import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'
import type { BlogIndexItem } from '@/app/blog/types'

export async function saveBlogEdits(originalItems: BlogIndexItem[], nextItems: BlogIndexItem[], categories: string[]): Promise<void> {
	await apiFetch('/api/blogs/save', {
		method: 'PUT',
		body: JSON.stringify({ originalItems, nextItems, categories })
	})
	toast.success('保存成功')
}
