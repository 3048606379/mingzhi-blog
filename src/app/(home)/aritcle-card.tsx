import Card from '@/components/card'
import { useLatestBlog } from '@/hooks/use-blog-index'
import dayjs from 'dayjs'
import Link from 'next/link'

export default function ArticleCard() {
	const { blog, loading } = useLatestBlog()

	return (
		<Card>
			<h2 className='text-sm' style={{ color: 'var(--color-secondary)' }}>最新文章</h2>

			{loading ? (
				<div className='flex h-[60px] items-center justify-center'>
					<span className='text-xs' style={{ color: 'var(--color-secondary)' }}>加载中...</span>
				</div>
			) : blog ? (
				<Link href={`/blog/${blog.slug}`} className='mt-3 flex transition-opacity hover:opacity-80'>
					{blog.cover ? (
						<img src={blog.cover} alt='cover' className='mr-3 h-12 w-12 shrink-0 rounded-lg border object-cover' />
					) : (
						<div className='mr-3 grid h-12 w-12 shrink-0 place-items-center rounded-lg border' style={{ borderColor: 'var(--color-border)' }}>+</div>
					)}
					<div className='flex-1'>
						<h3 className='line-clamp-1 text-sm font-medium'>{blog.title || blog.slug}</h3>
						{blog.summary && <p className='mt-1 line-clamp-3 text-xs' style={{ color: 'var(--color-secondary)' }}>{blog.summary}</p>}
						<p className='mt-3 text-xs' style={{ color: 'var(--color-secondary)' }}>{dayjs(blog.date).format('YYYY/M/D')}</p>
					</div>
				</Link>
			) : (
				<div className='flex h-[60px] items-center justify-center'>
					<span className='text-xs' style={{ color: 'var(--color-secondary)' }}>暂无文章</span>
				</div>
			)}
		</Card>
	)
}
