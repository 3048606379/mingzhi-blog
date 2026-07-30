import { toast } from 'sonner'

const TOKEN_KEY = 'blog_auth_token'

export function getToken(): string | null {
	if (typeof sessionStorage === 'undefined') return null
	return sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
	if (typeof sessionStorage === 'undefined') return
	sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
	if (typeof sessionStorage === 'undefined') return
	sessionStorage.removeItem(TOKEN_KEY)
}

export function hasToken(): boolean {
	return !!getToken()
}

export function getAuthHeaders(): Record<string, string> {
	const token = getToken()
	if (!token) return {}
	return { Authorization: `Bearer ${token}` }
}

export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
	const headers = {
		...getAuthHeaders(),
		...(init?.headers || {})
	}

	if (!(init?.body instanceof FormData)) {
		(headers as any)['Content-Type'] = 'application/json'
	}

	const res = await fetch(url, { ...init, headers })

	if (res.status === 401) {
		clearToken()
		toast.error('认证已过期，请重新登录')
		throw new Error('Unauthorized')
	}

	if (!res.ok) {
		const body = await res.json().catch(() => ({ error: 'Request failed' }))
		throw new Error(body.error || `HTTP ${res.status}`)
	}

	return res
}
