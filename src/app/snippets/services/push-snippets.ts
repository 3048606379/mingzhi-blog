import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'

export type PushSnippetsParams = {
	snippets: string[]
}

export async function pushSnippets(params: PushSnippetsParams): Promise<void> {
	await apiFetch('/api/snippets', {
		method: 'PUT',
		body: JSON.stringify({ snippets: params.snippets })
	})
	toast.success('保存成功')
}
