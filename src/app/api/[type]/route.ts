import { NextRequest } from 'next/server'
import { validateAuth } from '@/lib/server-auth'
import { writeJson, writeBase64File, ensureDir } from '@/lib/server-data'
import path from 'path'

function getExt(filename: string): string {
	const dot = filename.lastIndexOf('.')
	return dot >= 0 ? filename.slice(dot) : '.png'
}

const TYPES = ['share', 'projects', 'bloggers', 'pictures'] as const

export async function PUT(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
	const authErr = validateAuth(request)
	if (authErr) return authErr

	const { type } = await params
	if (!(TYPES as readonly string[]).includes(type)) {
		return Response.json({ error: 'Unknown type' }, { status: 400 })
	}

	let body: any
	try {
		body = await request.json()
	} catch (err: any) {
		console.error(`Failed to parse JSON body for ${type}:`, err?.message)
		return Response.json({
			error: 'Request body too large or invalid JSON. Try reducing image sizes or uploading fewer images at once.'
		}, { status: 413 })
	}

	try {
		const { items, images } = body
		let data = items || (type === 'about' ? body : body[type])

		const imagesDir = path.join('images', type)
		await ensureDir(path.join(process.cwd(), 'public', 'data', imagesDir))

		if (images && Array.isArray(images)) {
			for (const img of images) {
				if (!img.data) continue
				try {
					const ext = getExt(img.filename || 'image.png')
					const filename = `${img.hash || Date.now()}${ext}`
					await writeBase64File(imagesDir, filename, img.data)

					const publicPath = `/data/images/${type}/${filename}`
					if (img.key) {
						const [groupId, indexStr] = img.key.split('::')
						if (type === 'pictures') {
							data = data.map((p: any) => {
								if (p.id !== groupId) return p
								const idx = Number(indexStr) || 0
								if (p.images) {
									const imgs = [...p.images]
									imgs[idx] = publicPath
									return { ...p, image: undefined, images: imgs }
								}
								if (p.image) return { ...p, image: publicPath }
								return p
							})
						} else {
							data = data.map((item: any) => (item.url === img.key ? { ...item, [img.field || 'logo']: publicPath } : item))
						}
					}
				} catch (imgErr: any) {
					console.error(`Failed to process image ${img.filename}:`, imgErr?.message)
				}
			}
		}

		await writeJson(type, 'list.json', data)

		return Response.json({ ok: true })
	} catch (err: any) {
		console.error(`Error saving ${type}:`, err)
		return Response.json({ error: err?.message || 'Internal error' }, { status: 500 })
	}
}
