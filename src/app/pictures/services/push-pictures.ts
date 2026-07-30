import { toast } from 'sonner'
import { fileToBase64NoPrefix, hashFileSHA256 } from '@/lib/file-utils'
import { apiFetch } from '@/lib/api-client'
import type { ImageItem } from '../../projects/components/image-upload-dialog'
import { Picture } from '../page'

export type PushPicturesParams = {
	pictures: Picture[]
	imageItems?: Map<string, ImageItem>
}

export async function pushPictures(params: PushPicturesParams): Promise<void> {
	const { pictures, imageItems } = params

	const imageUploads: any[] = []

	if (imageItems && imageItems.size > 0) {
		for (const [key, imageItem] of imageItems.entries()) {
			if (imageItem.type === 'file') {
				const hash = imageItem.hash || (await hashFileSHA256(imageItem.file))
				imageUploads.push({
					key,
					hash,
					filename: imageItem.file.name,
					data: await fileToBase64NoPrefix(imageItem.file)
				})
			}
		}
	}

	await apiFetch('/api/pictures', {
		method: 'PUT',
		body: JSON.stringify({ items: pictures, images: imageUploads })
	})

	toast.success('保存成功')
}
