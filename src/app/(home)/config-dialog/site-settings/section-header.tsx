export function SectionHeader({ children }: { children: React.ReactNode }) {
	return (
		<div className='mb-4 border-t pt-6 text-[9px] tracking-[0.35em]' style={{ color: '#444', borderColor: 'var(--color-border)' }}>
			{'// '}
			{children}
		</div>
	)
}
