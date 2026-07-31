import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

/**
 * Always-fresh blog index.
 *
 * /blogs/index.json is overwritten at publish time, but in production that URL
 * is handled by the static public-file layer (and any proxy/CDN in front may
 * cache .json responses). The blog list reads through this endpoint instead —
 * no file extension, /api/ prefix, and no-store make it bypass static caches.
 */
export async function GET() {
	try {
		const raw = await fs.readFile(path.join(process.cwd(), 'public', 'blogs', 'index.json'), 'utf-8')
		return new Response(raw, {
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
				'Cache-Control': 'no-store'
			}
		})
	} catch {
		return Response.json([], { headers: { 'Cache-Control': 'no-store' } })
	}
}
