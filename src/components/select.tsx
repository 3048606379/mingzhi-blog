'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'

interface SelectOption {
	value: string
	label: ReactNode
}

interface SelectProps {
	value: string
	onChange: (value: string) => void
	options: SelectOption[]
	className?: string
	disabled?: boolean
}

export function Select({ value, onChange, options, className, disabled }: SelectProps) {
	const [open, setOpen] = useState(false)
	const [mounted, setMounted] = useState(false)
	const triggerRef = useRef<HTMLButtonElement>(null)
	const dropdownRef = useRef<HTMLDivElement>(null)
	const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })

	const selectedOption = options.find(opt => opt.value === value) || options[0]

	useEffect(() => {
		setMounted(true)
	}, [])

	useEffect(() => {
		if (open && triggerRef.current) {
			const rect = triggerRef.current.getBoundingClientRect()
			setPosition({
				top: rect.bottom + 8,
				left: rect.left,
				width: rect.width
			})
		}
	}, [open])

	useEffect(() => {
		if (!open) return

		const updatePosition = () => {
			if (triggerRef.current) {
				const rect = triggerRef.current.getBoundingClientRect()
				setPosition({
					top: rect.bottom + 8,
					left: rect.left,
					width: rect.width
				})
			}
		}

		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as Node
			if (triggerRef.current && !triggerRef.current.contains(target) && dropdownRef.current && !dropdownRef.current.contains(target)) {
				setOpen(false)
			}
		}

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setOpen(false)
			}
		}

		const handleScroll = () => {
			updatePosition()
		}

		const handleResize = () => {
			updatePosition()
		}

		document.addEventListener('mousedown', handleClickOutside)
		document.addEventListener('keydown', handleEscape)
		window.addEventListener('scroll', handleScroll, true)
		window.addEventListener('resize', handleResize)

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleEscape)
			window.removeEventListener('scroll', handleScroll, true)
			window.removeEventListener('resize', handleResize)
		}
	}, [open])

	const handleSelect = (optionValue: string) => {
		onChange(optionValue)
		setOpen(false)
	}

	return (
		<>
			<button
				ref={triggerRef}
				type='button'
				onClick={() => !disabled && setOpen(!open)}
				disabled={disabled}
			className={cn(
				'relative flex items-center justify-between gap-2 border bg-transparent px-3 py-2 text-xs outline-none transition-colors',
				'border-[var(--color-border)] hover:border-[var(--color-brand)]',
				disabled && 'opacity-50',
				className
			)}>
				<span className='flex-1 text-left'>{selectedOption?.label}</span>
				<svg
					className={cn('h-3.5 w-3.5 transition-transform duration-200', open && 'rotate-180')}
					fill='none'
					viewBox='0 0 24 24'
					stroke='currentColor'
					strokeWidth={2}>
					<path strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7' />
				</svg>
			</button>

			{mounted &&
				createPortal(
					<AnimatePresence>
						{open && (
							<motion.div
								ref={dropdownRef}
								initial={{ opacity: 0, y: -8, scale: 0.95 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: -8, scale: 0.95 }}
								transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
								className='fixed z-50 border bg-black'
								style={{
									top: `${position.top}px`,
									left: `${position.left}px`,
									width: `${position.width}px`
								}}>
								<div className='scrollbar-none max-h-64 overflow-y-auto p-1.5'>
									{options.map(option => {
										const isSelected = option.value === value
										return (
											<button
												key={option.value}
												type='button'
												onClick={() => handleSelect(option.value)}
												className={cn(
													'w-full px-3 py-2 text-left text-xs transition-colors',
													isSelected ? 'bg-brand/10 text-brand font-medium' : 'hover:bg-white/5 hover:text-white'
												)}>
												{option.label}
											</button>
										)
									})}
								</div>
							</motion.div>
						)}
					</AnimatePresence>,
					document.body
				)}
		</>
	)
}
