import { NextRequest } from 'next/server'
import { validateAuth } from '@/lib/server-auth'
import { writeJson, writeBase64File, ensureDir } from '@/lib/server-data'
import path from 'path'

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
		const { title, description, content } = body
		await writeJson('about', 'list.json', { title, description, content })
		return Response.json({ ok: true })
	} catch (err: any) {
		console.error('Error saving about:', err)
		return Response.json({ error: err?.message || 'Internal error' }, { status: 500 })
	}
}
