import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'

export type AboutData = {
	title: string
	description: string
	content: string
}

export async function pushAbout(data: AboutData): Promise<void> {
	await apiFetch('/api/about', {
		method: 'PUT',
		body: JSON.stringify(data)
	})
	toast.success('保存成功')
}
