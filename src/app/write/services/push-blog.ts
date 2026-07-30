import { toast } from 'sonner'
import { fileToBase64NoPrefix } from '@/lib/file-utils'
import { apiFetch } from '@/lib/api-client'
import type { ImageItem } from '../types'

export type PushBlogParams = {
	form: {
		slug: string
		title: string
		md: string
		tags: string[]
		date?: string
		summary?: string
		hidden?: boolean
		category?: string
	}
	cover?: ImageItem | null
	images?: ImageItem[]
	mode?: 'create' | 'edit'
	originalSlug?: string | null
}

export async function pushBlog(params: PushBlogParams): Promise<void> {
	const { form, cover, images, mode, originalSlug } = params

	if (!form.slug) throw new Error('需要 slug')

	const payload: any = { form, mode, originalSlug }

	// Convert file images to base64
	if (cover?.type === 'file') {
		payload.cover = {
			type: 'file',
			id: cover.id,
			hash: cover.hash,
			filename: cover.file.name,
			data: await fileToBase64NoPrefix(cover.file)
		}
	} else if (cover?.type === 'url') {
		payload.cover = { type: 'url', url: cover.url }
	}

	payload.images = await Promise.all(
		(images || []).map(async img => {
			if (img.type === 'file') {
				return {
					id: img.id,
					type: 'file',
					hash: img.hash,
					filename: img.file.name,
					data: await fileToBase64NoPrefix(img.file)
				}
			}
			return { id: img.id, type: 'url', url: img.url }
		})
	)

	await apiFetch('/api/blogs/publish', {
		method: 'POST',
		body: JSON.stringify(payload)
	})

	toast.success('发布成功')
}
