import { toast } from 'sonner'
import { fileToBase64NoPrefix } from '@/lib/file-utils'
import { apiFetch } from '@/lib/api-client'
import type { SiteContent, CardStyles } from '../stores/config-store'
import type { FileItem, ArtImageUploads, SocialButtonImageUploads, BackgroundImageUploads } from '../config-dialog/site-settings/types'

export async function pushSiteContent(
	siteContent: SiteContent,
	cardStyles: CardStyles,
	faviconItem?: FileItem | null,
	avatarItem?: FileItem | null,
	artImageUploads?: ArtImageUploads,
	removedArtImages?: SiteContent['artImages'],
	backgroundImageUploads?: BackgroundImageUploads,
	removedBackgroundImages?: SiteContent['backgroundImages'],
	socialButtonImageUploads?: SocialButtonImageUploads
): Promise<void> {
	const payload: any = { siteContent, cardStyles }

	if (faviconItem?.type === 'file') {
		payload.favicon = { type: 'file', data: await fileToBase64NoPrefix(faviconItem.file) }
	}
	if (avatarItem?.type === 'file') {
		payload.avatar = { type: 'file', data: await fileToBase64NoPrefix(avatarItem.file) }
	}

	if (artImageUploads) {
		const converted: Record<string, any> = {}
		for (const [id, item] of Object.entries(artImageUploads)) {
			if (item.type === 'file') {
				converted[id] = { type: 'file', data: await fileToBase64NoPrefix(item.file) }
			}
		}
		if (Object.keys(converted).length > 0) payload.artImages = converted
	}

	if (backgroundImageUploads) {
		const converted: Record<string, any> = {}
		for (const [id, item] of Object.entries(backgroundImageUploads)) {
			if (item.type === 'file') {
				converted[id] = { type: 'file', data: await fileToBase64NoPrefix(item.file) }
			}
		}
		if (Object.keys(converted).length > 0) payload.backgroundImages = converted
	}

	if (socialButtonImageUploads) {
		const converted: Record<string, any> = {}
		for (const [id, item] of Object.entries(socialButtonImageUploads)) {
			if (item.type === 'file') {
				converted[id] = { type: 'file', data: await fileToBase64NoPrefix(item.file) }
			}
		}
		if (Object.keys(converted).length > 0) payload.socialButtonImages = converted
	}

	if (removedArtImages?.length) payload.removedArtImages = removedArtImages
	if (removedBackgroundImages?.length) payload.removedBackgroundImages = removedBackgroundImages

	await apiFetch('/api/site-content', {
		method: 'PUT',
		body: JSON.stringify(payload)
	})

	toast.success('保存成功')
}
