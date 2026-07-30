import { NextRequest } from 'next/server'

const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'admin'

export function checkAuth(request: NextRequest): boolean {
	const header = request.headers.get('authorization')
	if (!header) return false
	const token = header.replace(/^Bearer\s+/i, '')
	return token === AUTH_PASSWORD
}

export function authResponse(body: object, status: number = 401) {
	return Response.json(body, { status })
}

export function validateAuth(request: NextRequest): Response | null {
	if (!checkAuth(request)) {
		return authResponse({ error: 'Unauthorized' })
	}
	return null
}
