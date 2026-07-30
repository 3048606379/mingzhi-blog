import { NextRequest } from 'next/server'

const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'admin'

export async function POST(request: NextRequest) {
	let body: { password?: string }
	try {
		body = await request.json()
	} catch {
		return Response.json({ error: 'Invalid JSON' }, { status: 400 })
	}

	if (body.password === AUTH_PASSWORD) {
		return Response.json({ token: AUTH_PASSWORD })
	}

	return Response.json({ error: 'Wrong password' }, { status: 401 })
}
