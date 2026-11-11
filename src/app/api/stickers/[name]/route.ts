import { servePublicFile } from '@/lib/serve-public-file'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
	const { name } = await params
	return servePublicFile('stickers', [name])
}
