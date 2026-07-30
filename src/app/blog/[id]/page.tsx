'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import { motion } from 'motion/react'
import { BlogPreview } from '@/components/blog-preview'
import { loadBlog, type BlogConfig } from '@/lib/load-blog'
import { useReadArticles } from '@/hooks/use-read-articles'
import LiquidGrass from '@/components/liquid-grass'

export default function Page() {
	const params = useParams() as { id?: string | string[] }
	const slug = Array.isArray(params?.id) ? params.id[0] : params?.id || ''
	const router = useRouter()
	const { markAsRead } = useReadArticles()

	const [blog, setBlog] = useState<{ config: BlogConfig; markdown: string; cover?: string } | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState<boolean>(true)

	useEffect(() => {
		let cancelled = false
		async function run() {
			if (!slug) return
			try {
				setLoading(true)
				const blogData = await loadBlog(slug)

				if (!cancelled) {
					setBlog(blogData)
					setError(null)
					markAsRead(slug)
				}
			} catch (e: any) {
				if (!cancelled) setError(e?.message || '加载失败')
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		run()
		return () => {
			cancelled = true
		}
	}, [slug, markAsRead])

	const title = useMemo(() => (blog?.config.title ? blog.config.title : slug), [blog?.config.title, slug])
	const date = useMemo(() => dayjs(blog?.config.date).format('YYYY.MM.DD'), [blog?.config.date])
	const tags = blog?.config.tags || []

	const handleEdit = () => {
		router.push(`/write/${slug}`)
	}

	if (!slug) {
		return <div className='flex h-full items-center justify-center text-xs' style={{ color: '#555' }}>&gt; invalid link</div>
	}

	if (loading) {
		return <div className='flex h-full items-center justify-center text-xs' style={{ color: '#555' }}>&gt; fetching...</div>
	}

	if (error) {
		return <div className='flex h-full items-center justify-center text-xs text-red-500'>&gt; {error}</div>
	}

	if (!blog) {
		return <div className='flex h-full items-center justify-center text-xs' style={{ color: '#555' }}>&gt; post not found</div>
	}

	return (
		<>
			<BlogPreview
				markdown={blog.markdown}
				title={title}
				tags={tags}
				date={date}
				summary={blog.config.summary}
				cover={blog.cover ? (blog.cover.startsWith('http') ? blog.cover : `${origin}${blog.cover}`) : undefined}
				slug={slug}
			/>

			<motion.button
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				onClick={handleEdit}
				className='absolute top-6 right-10 border bg-transparent px-4 py-2 text-xs tracking-[0.15em] transition-colors hover:border-[var(--color-brand)] hover:text-white max-sm:hidden'
				style={{ borderColor: 'var(--color-border)', color: '#888' }}>
				&gt; EDIT
			</motion.button>

			{slug === 'liquid-grass' && <LiquidGrass />}
		</>
	)
}
