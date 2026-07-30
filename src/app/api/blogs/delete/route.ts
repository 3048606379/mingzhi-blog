import { NextRequest } from 'next/server'
import { validateAuth } from '@/lib/server-auth'
import path from 'path'
import fsPromises from 'fs/promises'

const BLOGS_DIR = path.join(process.cwd(), 'public', 'blogs')

async function deleteDirSafe(dirPath: string) {
	try {
		await fsPromises.rm(dirPath, { recursive: true, force: true })
	} catch { /* ignore */ }
}

export async function DELETE(request: NextRequest) {
	const authErr = validateAuth(request)
	if (authErr) return authErr

	const slug = request.nextUrl.searchParams.get('slug')
	if (!slug) {
		return Response.json({ error: 'Missing slug' }, { status: 400 })
	}

	try {
		// Delete blog directory
		const blogDir = path.join(BLOGS_DIR, slug)
		await deleteDirSafe(blogDir)

		// Update index.json
		const indexPath = path.join(BLOGS_DIR, 'index.json')
		let indexList: any[] = []
		try {
			const raw = await fsPromises.readFile(indexPath, 'utf-8')
			indexList = JSON.parse(raw)
		} catch { /* ignore */ }
		const updated = indexList.filter((i: any) => i.slug !== slug)
		await fsPromises.writeFile(indexPath, JSON.stringify(updated, null, 2), 'utf-8')

		return Response.json({ ok: true })
	} catch (err: any) {
		console.error('Blog delete error:', err)
		return Response.json({ error: err?.message || 'Internal error' }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	const authErr = validateAuth(request)
	if (authErr) return authErr

	// Batch delete
	let body: { slugs?: string[] }
	try {
		body = await request.json()
	} catch {
		return Response.json({ error: 'Invalid JSON' }, { status: 400 })
	}

	const slugs = Array.from(new Set((body.slugs || []).filter(Boolean)))
	if (slugs.length === 0) {
		return Response.json({ error: 'No slugs provided' }, { status: 400 })
	}

	try {
		for (const slug of slugs) {
			await deleteDirSafe(path.join(BLOGS_DIR, slug))
		}

		const indexPath = path.join(BLOGS_DIR, 'index.json')
		let indexList: any[] = []
		try {
			const raw = await fsPromises.readFile(indexPath, 'utf-8')
			indexList = JSON.parse(raw)
		} catch { /* ignore */ }
		const slugSet = new Set(slugs)
		const updated = indexList.filter((i: any) => !slugSet.has(i.slug))
		await fsPromises.writeFile(indexPath, JSON.stringify(updated, null, 2), 'utf-8')

		return Response.json({ ok: true })
	} catch (err: any) {
		console.error('Batch delete error:', err)
		return Response.json({ error: err?.message || 'Internal error' }, { status: 500 })
	}
}
