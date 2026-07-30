'use client'

import { cn } from '@/lib/utils'

interface Props {
	className?: string
	children: React.ReactNode
}

export default function Card({ children, className }: Props) {
	return (
		<div className={cn('card-flat', className)}>
			{children}
		</div>
	)
}
