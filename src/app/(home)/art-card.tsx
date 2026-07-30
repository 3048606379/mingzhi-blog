import Card from '@/components/card'
import { useConfigStore } from './stores/config-store'
import { useRouter } from 'next/navigation'

export default function ArtCard() {
	const { siteContent } = useConfigStore()
	const router = useRouter()

	const artImages = siteContent.artImages ?? []
	const currentId = siteContent.currentArtImageId
	const currentArt = (currentId ? artImages.find(item => item.id === currentId) : undefined) ?? artImages[0]
	const artUrl = currentArt?.url || '/images/art/cat.png'

	return (
		<Card className='p-2'>
			<img
				onClick={() => router.push('/pictures')}
				src={artUrl}
				alt='art'
				className='h-48 w-full rounded-lg object-cover cursor-pointer'
			/>
		</Card>
	)
}
