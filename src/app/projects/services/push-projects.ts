import { toast } from 'sonner'
import { fileToBase64NoPrefix, hashFileSHA256 } from '@/lib/file-utils'
import { apiFetch } from '@/lib/api-client'
import type { Project } from '../components/project-card'
import type { ImageItem } from '../components/image-upload-dialog'

export type PushProjectsParams = {
	projects: Project[]
	imageItems?: Map<string, ImageItem>
}

export async function pushProjects(params: PushProjectsParams): Promise<void> {
	const { projects, imageItems } = params

	const imageUploads: any[] = []

	if (imageItems && imageItems.size > 0) {
		for (const [url, imageItem] of imageItems.entries()) {
			if (imageItem.type === 'file') {
				const hash = imageItem.hash || (await hashFileSHA256(imageItem.file))
				imageUploads.push({
					key: url,
					field: 'image',
					hash,
					filename: imageItem.file.name,
					data: await fileToBase64NoPrefix(imageItem.file)
				})
			}
		}
	}

	await apiFetch('/api/projects', {
		method: 'PUT',
		body: JSON.stringify({ items: projects, images: imageUploads })
	})

	toast.success('保存成功')
}
