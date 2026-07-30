import Card from '@/components/card'
import { useConfigStore } from './stores/config-store'
import Link from 'next/link'

function getGreeting() {
	const hour = new Date().getHours()
	if (hour >= 6 && hour < 12) return 'Good Morning'
	else if (hour >= 12 && hour < 18) return 'Good Afternoon'
	else if (hour >= 18 && hour < 22) return 'Good Evening'
	else return 'Good Night'
}

export default function HiCard() {
	const { siteContent } = useConfigStore()
	const greeting = getGreeting()
	const username = siteContent.meta.username || 'Suni'

	return (
		<Card className='text-center'>
			<Link href='/live2d'>
				<img src='/images/avatar.png' className='mx-auto rounded-full' style={{ width: 100, height: 100 }} />
			</Link>
			<h1 className='mt-3 text-xl'>
				{greeting}, <span className='text-linear text-2xl'>{username}</span>
			</h1>
		</Card>
	)
}
