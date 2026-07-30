import { useWriteStore } from '../../stores/write-store'
import { TagInput } from '../ui/tag-input'
import { useCategories } from '@/hooks/use-categories'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { Select } from '@/components/select'

const inputClass =
	'w-full border bg-transparent px-3 py-2 text-sm outline-none transition-colors hover:border-[var(--color-brand)] focus:border-[var(--color-brand)]'
const inputStyle = { color: '#bbb' }

export function MetaSection() {
	const { form, updateForm } = useWriteStore()

	const { categories } = useCategories()
	const { siteContent } = useConfigStore()
	const enableCategories = siteContent.enableCategories ?? false

	const categoryOptions = [{ value: '', label: '未分类' }, ...categories.map(cat => ({ value: cat, label: cat }))]

	return (
		<div style={{ animation: 'hud-row-in 0.4s ease 0.12s both' }}>
			<div className='text-[9px] tracking-[0.35em]' style={{ color: '#444' }}>
				{'// META'}
			</div>

			<div className='mt-4 space-y-2'>
				<textarea
					placeholder='为这篇文章写一段简短摘要'
					rows={2}
					className={`${inputClass} resize-none`}
					style={inputStyle}
					value={form.summary}
					onChange={e => updateForm({ summary: e.target.value })}
				/>

				<TagInput tags={form.tags} onChange={tags => updateForm({ tags })} />
				{enableCategories && (
					<Select className='w-full text-sm' value={form.category || ''} onChange={value => updateForm({ category: value })} options={categoryOptions} />
				)}
				<input
					type='datetime-local'
					placeholder='日期'
					className={inputClass}
					style={{ ...inputStyle, colorScheme: 'dark' }}
					value={form.date}
					onChange={e => {
						updateForm({ date: e.target.value })
					}}
				/>

			<label
				htmlFor='hidden-check'
				className='group flex w-fit cursor-pointer items-center gap-2 text-xs select-none transition-colors hover:text-white'
				style={{ color: '#777' }}>
				<span
					className='grid h-3.5 w-3.5 place-items-center border transition-colors'
					style={{ borderColor: form.hidden ? 'var(--color-brand)' : 'var(--color-border)' }}>
					{form.hidden && (
						<svg className='h-2.5 w-2.5' viewBox='0 0 12 12' fill='none'>
							<path d='M2 6.5l2.5 2.5L10 3.5' stroke='var(--color-brand)' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
						</svg>
					)}
				</span>
				<input
					type='checkbox'
					id='hidden-check'
					checked={form.hidden || false}
					onChange={e => updateForm({ hidden: e.target.checked })}
					className='sr-only'
				/>
				隐藏此文章（仅管理员可见）
			</label>
			</div>
		</div>
	)
}
