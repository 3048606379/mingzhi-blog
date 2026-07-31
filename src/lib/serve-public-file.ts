import path from 'path'
import fs from 'fs/promises'

/**
 * Runtime fallback for serving files under public/.
 *
 * In production (`next start`) Next.js only serves public/ files that existed
 * at build time — files written later by the admin APIs (new blog posts, site
 * config, uploaded images) would 404. Route handlers under /blogs/[...path]
 * and /data/[...path] call this to read those files straight from disk.
 */

const PUBLIC_DIR = path.join(process.cwd(), 'public')

const CONTENT_TYPES: Record<string, string> = {
	'.md': 'text/markdown; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.webp': 'image/webp',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.mp3': 'audio/mpeg',
	'.wav': 'audio/wav'
}

export async function servePublicFile(subdir: string, segments: string[]): Promise<Response> {
	const baseDir = path.join(PUBLIC_DIR, subdir)
	const filePath = path.join(baseDir, ...segments)

	// reject path traversal outside public/<subdir>
	if (filePath !== baseDir && !filePath.startsWith(baseDir + path.sep)) {
		return new Response('Not found', { status: 404 })
	}

	try {
		const data = await fs.readFile(filePath)
		const ext = path.extname(filePath).toLowerCase()
		const isText = ext === '.md' || ext === '.json'
		return new Response(new Uint8Array(data), {
			headers: {
				'Content-Type': CONTENT_TYPES[ext] || 'application/octet-stream',
				// markdown/json get edited in place — always revalidate.
				// binary assets are content-hash named — safe to cache forever.
				'Cache-Control': isText ? 'no-cache' : 'public, max-age=31536000, immutable'
			}
		})
	} catch {
		return new Response('Not found', { status: 404 })
	}
}
