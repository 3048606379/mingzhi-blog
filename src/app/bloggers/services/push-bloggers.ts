import { toast } from 'sonner'
import { fileToBase64NoPrefix, hashFileSHA256 } from '@/lib/file-utils'
import { apiFetch } from '@/lib/api-client'
import type { Blogger } from '../grid-view'
import type { AvatarItem } from '../components/avatar-upload-dialog'

export type PushBloggersParams = {
	bloggers: Blogger[]
	avatarItems?: Map<string, AvatarItem>
}

export async function pushBloggers(params: PushBloggersParams): Promise<void> {
	const { bloggers, avatarItems } = params

	const imageUploads: any[] = []

	if (avatarItems && avatarItems.size > 0) {
		for (const [url, avatarItem] of avatarItems.entries()) {
			if (avatarItem.type === 'file') {
				const hash = avatarItem.hash || (await hashFileSHA256(avatarItem.file))
				imageUploads.push({
					key: url,
					field: 'avatar',
					hash,
					filename: avatarItem.file.name,
					data: await fileToBase64NoPrefix(avatarItem.file)
				})
			}
		}
	}

	await apiFetch('/api/bloggers', {
		method: 'PUT',
		body: JSON.stringify({ items: bloggers, images: imageUploads })
	})

	toast.success('保存成功')
}
