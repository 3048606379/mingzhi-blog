import { create } from 'zustand'

export const useSplashStore = create<{ done: boolean; setDone: (done: boolean) => void }>(set => ({
	done: false,
	setDone: done => set({ done })
}))
