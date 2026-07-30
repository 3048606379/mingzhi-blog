import { create } from 'zustand'
import siteContent from '@/config/site-content.json'
import cardStyles from '@/config/card-styles.json'

export type SiteContent = typeof siteContent
export type CardStyles = typeof cardStyles

interface ConfigStore {
	siteContent: SiteContent
	cardStyles: CardStyles
	regenerateKey: number
	loaded: boolean
	loadConfig: () => Promise<void>
	setSiteContent: (content: SiteContent) => void
	setCardStyles: (styles: CardStyles) => void
	resetSiteContent: () => void
	resetCardStyles: () => void
	regenerateBubbles: () => void
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
	siteContent: { ...siteContent } as SiteContent,
	cardStyles: { ...cardStyles } as CardStyles,
	regenerateKey: 0,
	loaded: false,

	loadConfig: async () => {
		if (get().loaded) return
		try {
			const [sc, cs] = await Promise.all([
				fetch('/data/site/site-content.json').then(r => r.ok ? r.json() : null),
				fetch('/data/site/card-styles.json').then(r => r.ok ? r.json() : null)
			])
			if (sc) set({ siteContent: sc })
			if (cs) set({ cardStyles: cs })
			set({ loaded: true })
		} catch {}
	},

	setSiteContent: (content: SiteContent) => {
		set({ siteContent: content })
	},
	setCardStyles: (styles: CardStyles) => {
		set({ cardStyles: styles })
	},
	resetSiteContent: () => {
		set({ siteContent: { ...siteContent } as SiteContent })
	},
	resetCardStyles: () => {
		set({ cardStyles: { ...cardStyles } as CardStyles })
	},
	regenerateBubbles: () => {
		set(state => ({ regenerateKey: state.regenerateKey + 1 }))
	}
}))
