import { create } from 'zustand'
import { getToken, setToken, clearToken, hasToken } from '@/lib/api-client'

interface AuthStore {
	isAuth: boolean
	token: string | null
	login: (password: string) => Promise<boolean>
	logout: () => void
	checkAuth: () => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
	isAuth: hasToken(),
	token: getToken(),

	login: async (password: string) => {
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password })
			})
			if (!res.ok) return false
			const data = await res.json()
			setToken(data.token)
			set({ isAuth: true, token: data.token })
			return true
		} catch {
			return false
		}
	},

	logout: () => {
		clearToken()
		set({ isAuth: false, token: null })
	},

	checkAuth: () => {
		set({ isAuth: hasToken() })
	}
}))
