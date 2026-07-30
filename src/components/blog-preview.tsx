'use client'

import { useMarkdownRender } from '@/hooks/use-markdown-render'
import { useSize } from '@/hooks/use-size'
import { BlogSidebar } from '@/components/blog-sidebar'
import { useConfigStore } from '@/app/(home)/stores/config-store'

type BlogPreviewProps = {
	markdown: string
	title: string
	tags: string[]
	date: string
	summary?: string
	cover?: string
	slug?: string
}

export function BlogPreview({ markdown, title, tags, date, summary, cover, slug }: BlogPreviewProps) {
	const { maxSM: isMobile } = useSize()
	const { content, toc, loading } = useMarkdownRender(markdown)
	const { siteContent } = useConfigStore()
	const summaryInContent = siteContent.summaryInContent ?? false

	if (loading) {
		return <div className='flex h-full items-center justify-center text-xs' style={{ color: '#555' }}>&gt; rendering...</div>
	}

	return (
		<div className='mx-auto flex w-full max-w-[1080px] justify-center gap-10 px-10 py-12 max-sm:px-6'>
			<article className='min-w-0 flex-1' style={{ animation: 'hud-row-in 0.4s ease both' }}>
				<div className='text-[9px] tracking-[0.35em]' style={{ color: '#444' }}>
					{'// ARTICLE'}
				</div>
				{slug && (
					<div className='mt-4 text-[10px]' style={{ color: 'var(--color-brand)' }}>
						&gt; cat ./{slug}.md
					</div>
				)}

				<h1 className='mt-3 text-2xl font-semibold tracking-[0.1em] text-white'>{title}</h1>

				<div className='mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] tracking-[0.2em]' style={{ color: '#555' }}>
					<span className='tabular-nums'>{date}</span>
					{tags.map(t => (
						<span key={t} style={{ color: 'var(--color-brand)' }}>
							#{t}
						</span>
					))}
				</div>

				<div className='mt-6 h-px w-full' style={{ background: 'linear-gradient(to right, var(--color-brand), transparent)' }} />

				{summary && summaryInContent && (
					<div className='mt-6 border-l-2 pl-4 text-xs leading-relaxed' style={{ borderColor: 'var(--color-brand)', color: '#777' }}>
						{summary}
					</div>
				)}

				<div className='prose mt-8 max-w-none'>{content}</div>
			</article>

			{!isMobile && <BlogSidebar cover={cover} summary={summary} toc={toc} slug={slug} />}
		</div>
	)
}
