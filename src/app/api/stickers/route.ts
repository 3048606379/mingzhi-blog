import { NextRequest } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'
import { validateAuth } from '@/lib/server-auth'

export const dynamic = 'force-dynamic'

const STICKERS_DIR = path.join(process.cwd(), 'public', 'stickers')

const EXT_BY_MIME: Record<string, string> = {
	'image/png': '.png',
	'image/gif': '.gif',
	'image/jpeg': '.jpg',
	'image/webp': '.webp',
	'image/avif': '.avif'
}

const ALLOWED_EXT = new Set(Object.values(EXT_BY_MIME))
const MAX_SIZE = 8 * 1024 * 1024

function noStore(body: unknown, status = 200) {
	return Response.json(body, {
		status,
		headers: { 'Cache-Control': 'no-store' }
	})
}

function pickExt(file: File): string | null {
	const ext = path.extname(file.name).toLowerCase()
	if (ALLOWED_EXT.has(ext)) return ext
	const byMime = EXT_BY_MIME[file.type.toLowerCase()]
	return byMime || null
}

export async function GET() {
	try {
		await fs.mkdir(STICKERS_DIR, { recursive: true })
		const entries = await fs.readdir(STICKERS_DIR, { withFileTypes: true })

		const files = await Promise.all(
			entries
				.filter(entry => entry.isFile() && ALLOWED_EXT.has(path.extname(entry.name).toLowerCase()))
				.map(async entry => {
					const stat = await fs.stat(path.join(STICKERS_DIR, entry.name)).catch(() => null)
					return {
						name: entry.name,
						url: `/stickers/${encodeURIComponent(entry.name)}`,
						mtime: stat?.mtimeMs ?? 0
					}
				})
		)

		files.sort((a, b) => b.mtime - a.mtime)

		return noStore({ files })
	} catch (err: any) {
		console.error('Sticker list error:', err)
		return noStore({ error: err?.message || 'Internal error' }, 500)
	}
}

export async function POST(request: NextRequest) {
	const authErr = validateAuth(request)
	if (authErr) return authErr

	try {
		const form = await request.formData()
		const file = form.get('file')

		if (!(file instanceof File)) {
			return noStore({ error: '缺少图片文件' }, 400)
		}
		if (file.size === 0 || file.size > MAX_SIZE) {
			return noStore({ error: '图片为空或超过 8MB' }, 400)
		}

		const ext = pickExt(file)
		if (!ext) {
			return noStore({ error: '仅支持 png / gif / jpg / webp / avif' }, 400)
		}

		const buffer = Buffer.from(await file.arrayBuffer())
		const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16)
		const filename = `${hash}${ext}`

		await fs.mkdir(STICKERS_DIR, { recursive: true })
		await fs.writeFile(path.join(STICKERS_DIR, filename), buffer)

		return noStore({ ok: true, name: filename, url: `/stickers/${filename}` })
	} catch (err: any) {
		console.error('Sticker upload error:', err)
		return noStore({ error: err?.message || 'Internal error' }, 500)
	}
}
