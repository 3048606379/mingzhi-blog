'use client'

import dayjs from 'dayjs'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { useEditMode } from '@/hooks/use-edit-mode'
import { HudPageHeader, HudRow } from '@/components/hud-page'
import { deleteBlog } from '@/app/write/services/delete-blog'
import { toast } from 'sonner'

export default function BlogPage() {
	const { items, loading, mutate } = useBlogIndex()
	const { isEditMode, editLabel } = useEditMode()
	const sorted = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

	const handleDelete = async (slug: string) => {
		if (!confirm(`确定删除《${slug}》这篇博客吗？`)) return
		try {
			await deleteBlog(slug)
			await mutate()
		} catch (error: any) {
			toast.error(`删除失败: ${error?.message || '未知错误'}`)
		}
	}

	return (
		<>
			<div className='flex items-start justify-between gap-4'>
				<HudPageHeader title='BLOG' subtitle={`${sorted.length} POSTS`} />
				<div className='flex items-center gap-2 pt-1'>
					{isEditMode && (
						<span className='text-[9px] tracking-[0.3em]' style={{ color: 'var(--color-brand)', animation: 'hud-row-in 0.3s ease both' }}>
							· {editLabel}
							<span style={{ animation: 'splash-blink 0.6s step-end infinite' }}>▋</span>
						</span>
					)}
				</div>
			</div>
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
						<div key={blog.slug} className='relative'>
							<HudRow
								index={String(i + 1).padStart(2, '0')}
								title={blog.title || blog.slug}
								desc={blog.summary}
								meta={dayjs(blog.date).format('YYYY.MM.DD')}
								delay={i * 60}
								href={`/blog/${blog.slug}`}
							/>
							{isEditMode && (
								<button
									onClick={() => handleDelete(blog.slug)}
									className='absolute top-1/2 -right-7 z-10 -translate-y-1/2 px-1 transition-transform hover:scale-110'
									style={{ color: '#f87171', fontSize: 21, animation: 'hud-row-in 0.3s ease both' }}>
									×
								</button>
							)}
						</div>
					))}
				</div>
			)}
		</>
	)
}
