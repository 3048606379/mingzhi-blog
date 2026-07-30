import { CoverSection } from './sections/cover-section'
import { MetaSection } from './sections/meta-section'
import { ImagesSection } from './sections/images-section'

export function WriteSidebar() {
	return (
		<div className='flex w-[300px] shrink-0 flex-col gap-8'>
			<CoverSection />
			<MetaSection />
			<ImagesSection />
		</div>
	)
}
