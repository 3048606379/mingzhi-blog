import { NextRequest } from 'next/server'
import { validateAuth } from '@/lib/server-auth'
import { writeJson, writeBase64File, ensureDir } from '@/lib/server-data'
import path from 'path'

async function deleteFileSafe(fp: string) {
	try {
		const fs = await import('fs/promises')
		await fs.rm(fp, { force: true })
	} catch { /* ignore */ }
}

export async function PUT(request: NextRequest) {
	const authErr = validateAuth(request)
	if (authErr) return authErr

	let body: any
	try {
		body = await request.json()
	} catch {
		return Response.json({ error: 'Invalid JSON' }, { status: 400 })
	}

	try {
		const { siteContent, cardStyles, favicon, avatar, artImages, removedArtImages, backgroundImages, removedBackgroundImages, socialButtonImages } = body

		// favicon
		if (favicon?.type === 'file' && favicon.data) {
			await writeBase64File(path.join(process.cwd(), 'public'), 'favicon.png', favicon.data)
		}
		// avatar
		if (avatar?.type === 'file' && avatar.data) {
			const dir = path.join(process.cwd(), 'public', 'images')
			await ensureDir(dir)
			await writeBase64File('images', 'avatar.png', avatar.data)
		}
		// art images
		if (artImages) {
			for (const [id, item] of Object.entries(artImages)) {
				if ((item as any).type !== 'file' || !(item as any).data) continue
				const cfg = (siteContent.artImages || []).find((a: any) => a.id === id)
				if (!cfg) continue
				const urlPath = cfg.url.startsWith('/') ? cfg.url : `/${cfg.url}`
				await writeBase64File(path.join(process.cwd(), 'public'), urlPath.slice(1), (item as any).data)
			}
		}
		// removed art
		if (removedArtImages) {
			for (const art of removedArtImages) {
				const urlPath = art.url.startsWith('/') ? art.url.slice(1) : art.url
				await deleteFileSafe(path.join(process.cwd(), 'public', urlPath))
			}
		}
		// background images
		if (backgroundImages) {
			for (const [id, item] of Object.entries(backgroundImages)) {
				if ((item as any).type !== 'file' || !(item as any).data) continue
				const cfg = (siteContent.backgroundImages || []).find((b: any) => b.id === id)
				if (!cfg || !cfg.url.startsWith('/images/background/')) continue
				await writeBase64File(path.join(process.cwd(), 'public'), cfg.url.slice(1), (item as any).data)
			}
		}
		// removed background
		if (removedBackgroundImages) {
			for (const bg of removedBackgroundImages) {
				if (!bg.url.startsWith('/images/background/')) continue
				await deleteFileSafe(path.join(process.cwd(), 'public', bg.url.slice(1)))
			}
		}
		// social button images
		if (socialButtonImages) {
			for (const [buttonId, item] of Object.entries(socialButtonImages)) {
				if ((item as any).type !== 'file' || !(item as any).data) continue
				const btn = (siteContent.socialButtons || []).find((b: any) => b.id === buttonId)
				if (!btn || !btn.value.startsWith('/images/social-buttons/')) continue
				await writeBase64File(path.join(process.cwd(), 'public'), btn.value.slice(1), (item as any).data)
			}
		}

		// Save configs
		await writeJson('site', 'site-content.json', siteContent)
		await writeJson('site', 'card-styles.json', cardStyles)

		return Response.json({ ok: true })
	} catch (err: any) {
		console.error('Error saving site content:', err)
		return Response.json({ error: err?.message || 'Internal error' }, { status: 500 })
	}
}
