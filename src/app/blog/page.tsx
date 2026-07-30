'use client'

import dayjs from 'dayjs'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { HudPageHeader, HudRow } from '@/components/hud-page'

export default function BlogPage() {
	const { items, loading } = useBlogIndex()
	const sorted = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

	return (
		<>
			<HudPageHeader title='BLOG' subtitle={`${sorted.length} POSTS`} />
			{loading ? (
				<div className='text-xs' style={{ color: '#555' }}>
					&gt; fetching...
				</div>
			) : sorted.length === 0 ? (
				<div className='text-xs' style={{ color: '#555' }}>
					&gt; no posts yet
				</div>
			) : (
				<div className='flex flex-col'>
					{sorted.map((blog, i) => (
						<HudRow
							key={blog.slug}
							index={String(i + 1).padStart(2, '0')}
							title={blog.title || blog.slug}
							desc={blog.summary}
							meta={dayjs(blog.date).format('YYYY.MM.DD')}
							delay={i * 60}
							href={`/blog/${blog.slug}`}
						/>
					))}
				</div>
			)}
		</>
	)
}
