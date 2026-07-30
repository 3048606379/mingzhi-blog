import { toast } from 'sonner'
import { fileToBase64NoPrefix, hashFileSHA256 } from '@/lib/file-utils'
import { apiFetch } from '@/lib/api-client'
import type { Share } from '../components/share-card'
import type { LogoItem } from '../components/logo-upload-dialog'

export type PushSharesParams = {
	shares: Share[]
	logoItems?: Map<string, LogoItem>
}

export async function pushShares(params: PushSharesParams): Promise<void> {
	const { shares, logoItems } = params

	const imageUploads: any[] = []

	if (logoItems && logoItems.size > 0) {
		for (const [url, logoItem] of logoItems.entries()) {
			if (logoItem.type === 'file') {
				const hash = logoItem.hash || (await hashFileSHA256(logoItem.file))
				imageUploads.push({
					key: url,
					field: 'logo',
					hash,
					filename: logoItem.file.name,
					data: await fileToBase64NoPrefix(logoItem.file)
				})
			}
		}
	}

	await apiFetch('/api/share', {
		method: 'PUT',
		body: JSON.stringify({ items: shares, images: imageUploads })
	})

	toast.success('保存成功')
}
