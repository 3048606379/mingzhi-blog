import { BlogPreview } from '@/components/blog-preview'
import { useWriteData } from '../hooks/use-write-data'
import type { PublishForm } from '../types'

type WritePreviewProps = {
	form: PublishForm
	coverPreviewUrl: string | null
	onClose: () => void
	slug?: string
}

export function WritePreview({ form, coverPreviewUrl, onClose, slug }: WritePreviewProps) {
	const previewData = useWriteData()
	return (
		<div>
			<div onClick={e => e.stopPropagation()}>
				<BlogPreview
					markdown={previewData.markdown}
					title={previewData.title}
					tags={form.tags}
					date={previewData.date}
					summary={form.summary}
					cover={coverPreviewUrl || undefined}
					slug={slug}
				/>
			</div>
			<button
				className='fixed top-20 right-6 border bg-black px-4 py-2 text-xs tracking-[0.15em] transition-colors hover:border-[var(--color-brand)] hover:text-white'
				style={{ borderColor: 'var(--color-border)', color: '#888', zIndex: 50 }}
				onClick={onClose}>
				&gt; 关闭预览
			</button>
		</div>
	)
}
