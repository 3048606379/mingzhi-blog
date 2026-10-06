'use client'

import { create } from 'zustand'
import { useRouter, usePathname } from 'next/navigation'
import type { MouseEvent } from 'react'
import { isRoomPath } from '@/app/share/share-room'

type Phase = 'idle' | 'cover' | 'reveal'

export const useTransitionStore = create<{
	phase: Phase
	label: string
	coveredAt: number
	setPhase: (phase: Phase) => void
	setLabel: (label: string) => void
}>(set => ({
	phase: 'idle',
	label: '',
	coveredAt: 0,
	setPhase: phase => set({ phase, ...(phase === 'cover' ? { coveredAt: Date.now() } : {}) }),
	setLabel: label => set({ label })
}))

export function useTransitionNavigate() {
  const router = useRouter()
  const pathname = usePathname()
  const setPhase = useTransitionStore(s => s.setPhase)
  const setLabel = useTransitionStore(s => s.setLabel)

  return (href: string) => {
    if (href === pathname) return
    // read the freshest phase from the store to avoid any stale-closure races
    if (useTransitionStore.getState().phase !== 'idle') return
    // 房间页之间导航（仅桌面端）：房间外壳常驻在 layout 上，
    // 只切换中间面板内容，不播转场
    if (window.matchMedia('(min-width: 768px)').matches && isRoomPath(pathname || '') && isRoomPath(href)) {
      router.push(href)
      return
    }
    setLabel(`> cd ${href === '/' ? '~/' : href}`)
    setPhase('cover')
    // prefetch during the cover animation so reveal is instant
    router.prefetch(href)
    // push only after the cover animation (glitch + typing) has fully played
    setTimeout(() => {
      router.push(href)
    }, 250)
  }
}

export function isPlainClick(e: MouseEvent) {
	return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
}
