'use client'

import { ANIMATION_DELAY } from '@/consts'
import LikeButton from '@/components/like-button'
import { BlogToc } from '@/components/blog-toc'
import { ScrollTopButton } from '@/components/scroll-top-button'
import { useConfigStore } from '@/app/(home)/stores/config-store'

type TocItem = {
	id: string
	text: string
	level: number
}

type BlogSidebarProps = {
	cover?: string
	summary?: string
	toc: TocItem[]
	slug?: string
}

function SectionHeader({ children, delay }: { children: React.ReactNode; delay: number }) {
	return (
		<div className='text-[9px] tracking-[0.35em]' style={{ color: '#444', animation: `hud-row-in 0.4s ease ${delay}s both` }}>
			{'// '}
			{children}
		</div>
	)
}

export function BlogSidebar({ cover, summary, toc, slug }: BlogSidebarProps) {
	const { siteContent } = useConfigStore()
	const summaryInContent = siteContent.summaryInContent ?? false

	return (
		<div className='sticky flex w-[220px] shrink-0 flex-col items-start gap-8 self-start max-sm:hidden' style={{ top: 24 }}>
			{cover && (
				<div className='w-full'>
					<SectionHeader delay={ANIMATION_DELAY * 1}>COVER</SectionHeader>
					<div
						className='mt-3 border p-1.5'
						style={{ borderColor: 'var(--color-border)', animation: `hud-row-in 0.4s ease ${ANIMATION_DELAY * 1}s both` }}>
						<img src={cover} alt='cover' className='h-auto w-full object-cover' />
					</div>
				</div>
			)}

			{summary && !summaryInContent && (
				<div className='w-full'>
					<SectionHeader delay={ANIMATION_DELAY * 2}>SUMMARY</SectionHeader>
					<div
						className='scrollbar-none mt-3 max-h-[240px] overflow-auto border-l-2 pl-3 text-xs leading-relaxed'
						style={{ borderColor: 'var(--color-border)', color: '#777', animation: `hud-row-in 0.4s ease ${ANIMATION_DELAY * 2}s both` }}>
						{summary}
					</div>
				</div>
			)}

			<BlogToc toc={toc} delay={ANIMATION_DELAY * 3} />

			<div className='flex items-center gap-3' style={{ animation: `hud-row-in 0.4s ease ${ANIMATION_DELAY * 4}s both` }}>
				<LikeButton slug={slug} delay={0} />
				<ScrollTopButton delay={0} />
			</div>
		</div>
	)
}
