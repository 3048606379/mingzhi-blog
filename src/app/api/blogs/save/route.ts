import { NextRequest } from 'next/server'
import { validateAuth } from '@/lib/server-auth'
import path from 'path'
import fsPromises from 'fs/promises'

const BLOGS_DIR = path.join(process.cwd(), 'public', 'blogs')

export async function PUT(request: NextRequest) {
	const authErr = validateAuth(request)
	if (authErr) return authErr

	let body: any
	try {
		body = await request.json()
	} catch {
		return Response.json({ error: 'Invalid JSON' }, { status: 400 })
	}

	const { originalItems, nextItems, categories } = body

	try {
		// Delete removed blogs
		const nextSlugs = new Set((nextItems || []).map((i: any) => i.slug))
		const removedSlugs = (originalItems || [])
			.filter((item: any) => !nextSlugs.has(item.slug))
			.map((item: any) => item.slug)

		for (const slug of removedSlugs) {
			const blogDir = path.join(BLOGS_DIR, slug)
			try {
				await fsPromises.rm(blogDir, { recursive: true, force: true })
			} catch { /* ignore */ }
		}

		// Save index
		const sorted = [...(nextItems || [])].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
		const indexPath = path.join(BLOGS_DIR, 'index.json')
		await fsPromises.writeFile(indexPath, JSON.stringify(sorted, null, 2), 'utf-8')

		// Save categories
		if (categories) {
			const unique = Array.from(new Set((categories as string[]).map((c: string) => c.trim()).filter(Boolean)))
			const catPath = path.join(BLOGS_DIR, 'categories.json')
			await fsPromises.writeFile(catPath, JSON.stringify({ categories: unique }, null, 2), 'utf-8')
		}

		return Response.json({ ok: true })
	} catch (err: any) {
		console.error('Save edits error:', err)
		return Response.json({ error: err?.message || 'Internal error' }, { status: 500 })
	}
}
