import { NextRequest } from 'next/server'
import { validateAuth } from '@/lib/server-auth'
import path from 'path'
import fsPromises from 'fs/promises'

const BLOGS_DIR = path.join(process.cwd(), 'public', 'blogs')

async function ensureDir(dirPath: string) {
	await fsPromises.mkdir(dirPath, { recursive: true })
}

async function writeFile(filePath: string, content: string) {
	await ensureDir(path.dirname(filePath))
	await fsPromises.writeFile(filePath, content, 'utf-8')
}

async function writeBase64(filePath: string, b64: string) {
	await ensureDir(path.dirname(filePath))
	await fsPromises.writeFile(filePath, Buffer.from(b64, 'base64'))
}

async function deleteDirSafe(dirPath: string) {
	try {
		await fsPromises.rm(dirPath, { recursive: true, force: true })
	} catch { /* ignore */ }
}

interface BlogPayload {
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
	cover?: { type: 'url'; url: string } | { type: 'file'; hash: string; filename: string; data: string; id: string } | null
	images?: Array<{ id: string; type: 'file'; hash: string; filename: string; data: string } | { id: string; type: 'url'; url: string }>
	mode?: 'create' | 'edit'
	originalSlug?: string | null
}

function getImageExt(filename: string): string {
	const dot = filename.lastIndexOf('.')
	return dot >= 0 ? filename.slice(dot) : '.png'
}

export async function POST(request: NextRequest) {
	const authErr = validateAuth(request)
	if (authErr) return authErr

	let payload: BlogPayload
	try {
		payload = await request.json()
	} catch {
		return Response.json({ error: 'Invalid JSON' }, { status: 400 })
	}

	const { form, cover, images = [], mode = 'create', originalSlug } = payload
	if (!form?.slug) {
		return Response.json({ error: 'Missing slug' }, { status: 400 })
	}

	try {
		const blogDir = path.join(BLOGS_DIR, form.slug)

		if (mode === 'edit' && originalSlug && originalSlug !== form.slug) {
			await deleteDirSafe(path.join(BLOGS_DIR, originalSlug))
		}

		await ensureDir(blogDir)

		let md = form.md
		let coverPath: string | undefined

		const seenHashes = new Set<string>()
		for (const img of images) {
			if (img.type !== 'file') continue
			const ext = getImageExt(img.filename)
			const filename = `${img.hash}${ext}`
			const publicPath = `/blogs/${form.slug}/${filename}`

			if (!seenHashes.has(img.hash)) {
				await writeBase64(path.join(blogDir, filename), img.data)
				seenHashes.add(img.hash)
			}

			md = md.split(`(local-image:${img.id})`).join(`(${publicPath})`)

			if (cover?.type === 'file' && cover.id === img.id) {
				coverPath = publicPath
			}
		}

		if (cover?.type === 'url') {
			coverPath = cover.url
		} else if (cover?.type === 'file' && !coverPath) {
			const ext = getImageExt(cover.filename)
			const filename = `${cover.hash}${ext}`
			const publicPath = `/blogs/${form.slug}/${filename}`
			if (!seenHashes.has(cover.hash)) {
				await writeBase64(path.join(blogDir, filename), cover.data)
			}
			coverPath = publicPath
		}

		const dateStr = form.date || new Date().toISOString().slice(0, 16)
		const config = {
			title: form.title,
			tags: form.tags,
			date: dateStr,
			summary: form.summary,
			cover: coverPath,
			hidden: form.hidden,
			category: form.category
		}

		await writeFile(path.join(blogDir, 'index.md'), md)
		await writeFile(path.join(blogDir, 'config.json'), JSON.stringify(config, null, 2))

		// Update blog index
		const indexPath = path.join(BLOGS_DIR, 'index.json')
		let indexList: any[] = []
		try {
			const raw = await fsPromises.readFile(indexPath, 'utf-8')
			indexList = JSON.parse(raw)
		} catch { /* ignore */ }

		const entry = { slug: form.slug, title: form.title, tags: form.tags, date: dateStr, summary: form.summary, cover: coverPath, hidden: form.hidden, category: form.category }
		const map = new Map(indexList.map((i: any) => [i.slug, i]))
		map.set(form.slug, entry)
		const sorted = Array.from(map.values()).sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''))
		await fsPromises.writeFile(indexPath, JSON.stringify(sorted, null, 2), 'utf-8')

		// Update categories
		if (form.category) {
			const catPath = path.join(BLOGS_DIR, 'categories.json')
			let cats: string[] = []
			try {
				const raw = await fsPromises.readFile(catPath, 'utf-8')
				const data = JSON.parse(raw)
				cats = data.categories || []
			} catch { /* ignore */ }
			if (!cats.includes(form.category)) {
				cats.push(form.category)
				await fsPromises.writeFile(catPath, JSON.stringify({ categories: cats }, null, 2), 'utf-8')
			}
		}

		return Response.json({ ok: true })
	} catch (err: any) {
		console.error('Blog publish error:', err)
		return Response.json({ error: err?.message || 'Internal error' }, { status: 500 })
	}
}
