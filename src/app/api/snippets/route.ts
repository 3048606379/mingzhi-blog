import { NextRequest } from 'next/server'
import { validateAuth } from '@/lib/server-auth'
import { writeJson } from '@/lib/server-data'

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
		const { snippets } = body
		if (!Array.isArray(snippets)) {
			return Response.json({ error: 'snippets must be an array' }, { status: 400 })
		}
		await writeJson('snippets', 'list.json', snippets)
		return Response.json({ ok: true })
	} catch (err: any) {
		console.error('Error saving snippets:', err)
		return Response.json({ error: err?.message || 'Internal error' }, { status: 500 })
	}
}
