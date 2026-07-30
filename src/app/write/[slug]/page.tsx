'use client'

import { useParams } from 'next/navigation'
import { useWriteStore } from '../stores/write-store'
import { usePreviewStore } from '../stores/preview-store'
import { useLoadBlog } from '../hooks/use-load-blog'
import { WriteEditor } from '../components/editor'
import { WriteSidebar } from '../components/sidebar'
import { WriteActions } from '../components/actions'
import { WritePreview } from '../components/preview'

export default function EditBlogPage() {
	const params = useParams() as { slug?: string }
	const slug = params?.slug || ''

	const { form, cover } = useWriteStore()
	const { isPreview, closePreview } = usePreviewStore()
	const { loading } = useLoadBlog(slug)

	const coverPreviewUrl = cover ? (cover.type === 'url' ? cover.url : cover.previewUrl) : null

	if (loading) {
		return <div className='flex h-screen items-center justify-center text-xs tracking-[0.2em]' style={{ color: '#555' }}>&gt; loading...</div>
	}

	if (!slug) {
		return <div className='flex h-screen items-center justify-center text-xs tracking-[0.2em] text-red-400'>&gt; invalid blog id</div>
	}

	return isPreview ? (
		<WritePreview form={form} coverPreviewUrl={coverPreviewUrl} onClose={closePreview} slug={slug} />
	) : (
		<div className='flex flex-col gap-8 px-10 py-8'>
			<WriteActions />
			<div className='flex gap-10'>
				<WriteEditor />
				<WriteSidebar />
			</div>
		</div>
	)
}
