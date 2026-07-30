import { useWriteStore } from '../stores/write-store'
import { useRef } from 'react'

const defaultText = 'text'

export function WriteEditor() {
	const { form, updateForm, images, addFiles } = useWriteStore()
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	const insertText = (text: string) => {
		const textarea = textareaRef.current
		if (!textarea) return

		textarea.focus()
		// Use execCommand to preserve undo/redo stack
		const success = document.execCommand('insertText', false, text)

		if (!success) {
			// Fallback for browsers that don't support execCommand
			const { selectionStart, selectionEnd, value } = textarea
			const before = value.substring(0, selectionStart)
			const after = value.substring(selectionEnd)
			updateForm({ md: before + text + after })
			setTimeout(() => {
				textarea.setSelectionRange(selectionStart + text.length, selectionStart + text.length)
				textarea.focus()
			}, 0)
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		const textarea = textareaRef.current
		if (!textarea) return

		const { selectionStart, selectionEnd, value } = textarea
		const selectedText = value.substring(selectionStart, selectionEnd)

		// Ctrl/Cmd + B: Toggle Bold
		if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
			e.preventDefault()
			const before = value.substring(0, selectionStart)
			const after = value.substring(selectionEnd)

			const isBold = before.endsWith('**') && after.startsWith('**')

			if (isBold && selectedText) {
				textarea.setSelectionRange(selectionStart - 2, selectionEnd + 2)
				insertText(selectedText)
			} else {
				const text = selectedText || defaultText
				insertText(`**${text}**`)
				if (!selectedText) {
					setTimeout(() => {
						textarea.setSelectionRange(selectionStart + 2, selectionStart + 2 + defaultText.length)
					}, 0)
				}
			}
			return
		}

		// Ctrl/Cmd + I: Toggle Italic
		if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
			e.preventDefault()
			const before = value.substring(0, selectionStart)
			const after = value.substring(selectionEnd)

			const isItalic = before.endsWith('*') && after.startsWith('*') && !(before.endsWith('**') && after.startsWith('**'))

			if (isItalic && selectedText) {
				textarea.setSelectionRange(selectionStart - 1, selectionEnd + 1)
				insertText(selectedText)
			} else {
				const text = selectedText || defaultText
				insertText(`*${text}*`)
				if (!selectedText) {
					setTimeout(() => {
						textarea.setSelectionRange(selectionStart + 1, selectionStart + 1 + defaultText.length)
					}, 0)
				}
			}
			return
		}

		// Ctrl/Cmd + K: Link
		if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
			e.preventDefault()
			const text = selectedText || defaultText
			insertText(`[${text}](url)`)
			setTimeout(() => {
				const urlStart = selectionStart + text.length + 3
				textarea.setSelectionRange(urlStart, urlStart + 3)
			}, 0)
			return
		}

		// Tab: Indent
		if (e.key === 'Tab' && !e.shiftKey) {
			e.preventDefault()
			insertText('\t')
			return
		}

		// Shift + Tab: Outdent
		if (e.key === 'Tab' && e.shiftKey) {
			e.preventDefault()
			const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1
			const line = value.substring(lineStart, value.indexOf('\n', selectionStart))

			if (line.startsWith('\t')) {
				textarea.setSelectionRange(lineStart, lineStart + 1)
				insertText('')
			} else if (line.startsWith('  ')) {
				textarea.setSelectionRange(lineStart, lineStart + 2)
				insertText('')
			}
			return
		}
	}

	const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
		const items = e.clipboardData.items
		if (!items) return

		const imageFiles: File[] = []
		for (let i = 0; i < items.length; i++) {
			const item = items[i]
			if (item.type.startsWith('image/')) {
				const file = item.getAsFile()
				if (file) {
					imageFiles.push(file)
				}
			}
		}

		if (imageFiles.length > 0) {
			e.preventDefault()

			const resultImages = await addFiles(imageFiles).catch(() => [])

			if (resultImages && resultImages.length > 0) {
				const markdowns = resultImages.map(item => (item.type === 'url' ? `![](${item.url})` : `![](local-image:${item.id})`)).join('\n')
				insertText(markdowns)
			}
		}
	}

	return (
		<div className='flex min-h-[70vh] w-full max-w-[860px] flex-col' style={{ animation: 'hud-row-in 0.4s ease both' }}>
			<div className='text-[9px] tracking-[0.35em]' style={{ color: '#444' }}>
				{'// EDITOR'}
			</div>
			<div className='mt-4 flex gap-3'>
				<input
					type='text'
					placeholder='标题'
					className='flex-1 border bg-transparent px-3 py-2 text-sm outline-none transition-colors hover:border-[var(--color-brand)] focus:border-[var(--color-brand)]'
					style={{ color: '#bbb' }}
					value={form.title}
					onChange={e => updateForm({ title: e.target.value })}
				/>
				<input
					type='text'
					placeholder='slug（xx-xx）'
					className='w-[200px] border bg-transparent px-3 py-2 text-sm outline-none transition-colors hover:border-[var(--color-brand)] focus:border-[var(--color-brand)]'
					style={{ color: '#bbb' }}
					value={form.slug}
					onChange={e => updateForm({ slug: e.target.value })}
				/>
			</div>
			<textarea
				ref={textareaRef}
				placeholder='> markdown 内容...'
				className='mt-3 h-[60vh] w-full flex-1 resize-none border bg-transparent p-4 text-sm leading-relaxed outline-none transition-colors hover:border-[var(--color-brand)] focus:border-[var(--color-brand)]'
				style={{ color: '#aaa' }}
				value={form.md}
				onChange={e => updateForm({ md: e.target.value })}
				onKeyDown={handleKeyDown}
				onPaste={handlePaste}
			/>
		</div>
	)
}
