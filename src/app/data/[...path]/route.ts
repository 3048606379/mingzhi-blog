import { servePublicFile } from '@/lib/serve-public-file'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
	const { path: segments } = await params
	return servePublicFile('data', segments)
}
