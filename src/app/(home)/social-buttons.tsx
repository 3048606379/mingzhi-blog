import Card from '@/components/card'
import { useConfigStore } from './stores/config-store'
import GithubSVG from '@/svgs/github.svg'
import JuejinSVG from '@/svgs/juejin.svg'
import EmailSVG from '@/svgs/email.svg'
import XSVG from '@/svgs/x.svg'
import TgSVG from '@/svgs/tg.svg'
import WechatSVG from '@/svgs/wechat.svg'
import FacebookSVG from '@/svgs/facebook.svg'
import TiktokSVG from '@/svgs/tiktok.svg'
import InstagramSVG from '@/svgs/instagram.svg'
import WeiboSVG from '@/svgs/weibo.svg'
import XiaohongshuSVG from '@/svgs/小红书.svg'
import ZhihuSVG from '@/svgs/知乎.svg'
import BilibiliSVG from '@/svgs/哔哩哔哩.svg'
import QqSVG from '@/svgs/qq.svg'
import { useMemo, useState, useRef } from 'react'
import type React from 'react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'motion/react'
import { createPortal } from 'react-dom'

type SocialButtonType =
	| 'github' | 'juejin' | 'email' | 'link' | 'x' | 'tg'
	| 'wechat' | 'facebook' | 'tiktok' | 'instagram' | 'weibo'
	| 'xiaohongshu' | 'zhihu' | 'bilibili' | 'qq'

interface SocialButtonConfig {
	id: string
	type: SocialButtonType
	value: string
	label?: string
	order: number
}

export default function SocialButtons() {
	const { siteContent } = useConfigStore()
	const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({})
	const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({})
	const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

	const sortedButtons = useMemo(() => {
		const buttons = (siteContent.socialButtons || []) as SocialButtonConfig[]
		return [...buttons].sort((a, b) => a.order - b.order)
	}, [siteContent.socialButtons])

	if (sortedButtons.length === 0) return null

	const iconMap: Record<SocialButtonType, React.ComponentType<{ className?: string }>> = {
		github: GithubSVG, juejin: JuejinSVG, email: EmailSVG,
		wechat: WechatSVG, x: XSVG, tg: TgSVG, facebook: FacebookSVG,
		tiktok: TiktokSVG, instagram: InstagramSVG, weibo: WeiboSVG,
		xiaohongshu: XiaohongshuSVG, zhihu: ZhihuSVG, bilibili: BilibiliSVG,
		qq: QqSVG, link: () => null
	}

	const renderButton = (button: SocialButtonConfig) => {
		const Icon = iconMap[button.type]

		if (button.type === 'github') {
			return (
				<a key={button.id} href={button.value} target='_blank'
					className='flex items-center gap-2 rounded-xl border border-[#333] px-3 py-2 hover:border-[#666] transition-colors'>
					<Icon className='size-6' />
					<span className='text-sm'>{button.label || 'GitHub'}</span>
				</a>
			)
		}

		if (button.type === 'email' || button.type === 'wechat' || button.type === 'qq') {
			const messageMap = { email: '邮箱已复制', wechat: '微信已复制', qq: 'QQ已复制' }
			const isImagePath = button.value.startsWith('/images/')
			const isOpen = openDropdowns[button.id] || false

			if (isImagePath) {
				return (
					<div key={button.id} className='relative'>
						<button ref={el => { buttonRefs.current[button.id] = el }}
							onClick={() => setOpenDropdowns(p => ({ ...p, [button.id]: !p[button.id] }))}
							className='rounded-xl border border-[#333] p-2 hover:border-[#666] transition-colors'>
							<Icon className='size-6' />
						</button>
						{typeof window !== 'undefined' && createPortal(
							<AnimatePresence>
								{isOpen && (
									<>
										<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
											onClick={() => setOpenDropdowns(p => ({ ...p, [button.id]: false }))}
											className='fixed inset-0 z-40' />
										<motion.div ref={el => { dropdownRefs.current[button.id] = el }}
											initial={{ opacity: 0, y: -8, scale: 0.95 }}
											animate={{ opacity: 1, y: 0, scale: 1 }}
											exit={{ opacity: 0, y: -8, scale: 0.95 }}
											className='fixed z-50 rounded-2xl border border-[#333] bg-[#0a0a0a] p-4'
											style={{
												top: buttonRefs.current[button.id] ? `${buttonRefs.current[button.id]!.getBoundingClientRect().bottom + 8}px` : '0px',
												left: buttonRefs.current[button.id] ? `${buttonRefs.current[button.id]!.getBoundingClientRect().left}px` : '0px',
											}}>
											<img src={button.value} alt='QR' className='h-48 w-48 rounded-lg object-cover' />
										</motion.div>
									</>
								)}
							</AnimatePresence>, document.body)}
					</div>
				)
			}

			return (
				<button key={button.id}
					onClick={() => { navigator.clipboard.writeText(button.value).then(() => toast.success(messageMap[button.type])) }}
					className='rounded-xl border border-[#333] p-2 hover:border-[#666] transition-colors'>
					<Icon className='size-6' />
				</button>
			)
		}

		return (
			<a key={button.id} href={button.value} target='_blank'
				className='rounded-xl border border-[#333] p-2 hover:border-[#666] transition-colors'>
				<Icon className='size-6' />
			</a>
		)
	}

	return (
		<Card>
			<div className='flex flex-wrap gap-3'>
				{sortedButtons.map(button => renderButton(button))}
			</div>
		</Card>
	)
}
