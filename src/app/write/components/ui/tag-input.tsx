import { useState } from 'react'

type TagInputProps = {
	tags: string[]
	onChange: (tags: string[]) => void
}

export function TagInput({ tags, onChange }: TagInputProps) {
	const [tagInput, setTagInput] = useState<string>('')

	const handleAddTag = () => {
		if (tagInput.trim() && !tags.includes(tagInput.trim())) {
			onChange([...tags, tagInput.trim()])
			setTagInput('')
		}
	}

	const handleRemoveTag = (index: number) => {
		onChange(tags.filter((_, i) => i !== index))
	}

	return (
		<div className='w-full border bg-transparent px-3 py-2 transition-colors hover:border-[var(--color-brand)] focus-within:border-[var(--color-brand)]'>
			{tags.length > 0 && (
				<div className='mb-2 flex flex-wrap gap-2'>
					{tags.map((tag, index) => (
						<span key={index} className='flex items-center gap-1.5 border px-1.5 py-0.5 text-xs' style={{ borderColor: 'rgba(167,139,250,0.4)', color: 'var(--color-brand)' }}>
							#{tag}
							<button type='button' onClick={() => handleRemoveTag(index)} style={{ color: '#666' }}>
								×
							</button>
						</span>
					))}
				</div>
			)}
			<input
				type='text'
				placeholder='添加标签（按回车）'
				className='w-full bg-transparent text-sm outline-none'
				style={{ color: '#bbb' }}
				value={tagInput}
				onChange={e => setTagInput(e.target.value)}
				onKeyDown={e => {
					if (e.key === 'Enter') {
						e.preventDefault()
						handleAddTag()
					}
				}}
			/>
		</div>
	)
}
