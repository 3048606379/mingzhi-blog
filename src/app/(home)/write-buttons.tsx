import Card from '@/components/card'
import PenSVG from '@/svgs/pen.svg'
import DotsSVG from '@/svgs/dots.svg'
import { useRouter } from 'next/navigation'

export default function WriteButtons() {
	const router = useRouter()

	return (
		<Card>
			<div className='flex items-center gap-4'>
				<button
					onClick={() => router.push('/write')}
					className='brand-btn whitespace-nowrap'>
					<PenSVG className='size-4' />
					<span>写文章</span>
				</button>
				<button
					onClick={() => router.push('/config')}
					className='p-2 rounded-xl border border-[#333] hover:border-[#666] transition-colors'>
					<DotsSVG className='size-5' />
				</button>
			</div>
		</Card>
	)
}
