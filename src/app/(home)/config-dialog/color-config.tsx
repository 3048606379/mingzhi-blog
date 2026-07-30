'use client'

import { ColorPicker } from '@/components/color-picker'
import { XIcon } from 'lucide-react'
import type { SiteContent } from '../stores/config-store'
import siteContent from '@/config/site-content.json'
import { SectionHeader } from './site-settings/section-header'

interface ColorConfigProps {
	formData: SiteContent
	setFormData: React.Dispatch<React.SetStateAction<SiteContent>>
}

const DEFAULT_THEME_COLORS = siteContent.theme

export function ColorConfig({ formData, setFormData }: ColorConfigProps) {
	const theme = formData.theme ?? {}

	const handleThemeColorChange = (key: keyof typeof DEFAULT_THEME_COLORS, value: string) => {
		setFormData(prev => ({
			...prev,
			theme: {
				...prev.theme,
				[key]: value
			}
		}))
	}

	const handleBrandColorChange = (value: string) => {
		setFormData(prev => ({
			...prev,
			theme: {
				...prev.theme,
				colorBrand: value
			}
		}))
	}

	const handleColorChange = (index: number, value: string) => {
		const newColors = [...formData.backgroundColors]
		newColors[index] = value
		setFormData({ ...formData, backgroundColors: newColors })
	}

	const handleAddColor = () => {
		setFormData({
			...formData,
			backgroundColors: [...formData.backgroundColors, '#ffffff']
		})
	}

	const handleRemoveColor = (index: number) => {
		if (formData.backgroundColors.length > 1) {
			const newColors = formData.backgroundColors.filter((_, i) => i !== index)
			setFormData({ ...formData, backgroundColors: newColors })
		}
	}

	return (
		<div className='space-y-8'>
			<div>
				<SectionHeader>THEME_COLORS</SectionHeader>
				<div className='grid grid-cols-2 gap-4'>
					<div className='flex items-center gap-3'>
						<ColorPicker value={formData.theme?.colorBrand ?? '#a78bfa'} onChange={handleBrandColorChange} />
						<span className='text-xs' style={{ color: '#777' }}>主题色</span>
					</div>
					<div className='flex items-center gap-3'>
						<ColorPicker
							value={theme.colorBrandSecondary ?? DEFAULT_THEME_COLORS.colorBrandSecondary}
							onChange={value => handleThemeColorChange('colorBrandSecondary', value)}
						/>
						<span className='text-xs' style={{ color: '#777' }}>次级主题色</span>
					</div>
					<div className='flex items-center gap-3'>
						<ColorPicker value={theme.colorPrimary ?? DEFAULT_THEME_COLORS.colorPrimary} onChange={value => handleThemeColorChange('colorPrimary', value)} />
						<span className='text-xs' style={{ color: '#777' }}>主色</span>
					</div>
					<div className='flex items-center gap-3'>
						<ColorPicker
							value={theme.colorSecondary ?? DEFAULT_THEME_COLORS.colorSecondary}
							onChange={value => handleThemeColorChange('colorSecondary', value)}
						/>
						<span className='text-xs' style={{ color: '#777' }}>次色</span>
					</div>
					<div className='flex items-center gap-3'>
						<ColorPicker value={theme.colorBg ?? DEFAULT_THEME_COLORS.colorBg} onChange={value => handleThemeColorChange('colorBg', value)} />
						<span className='text-xs' style={{ color: '#777' }}>背景色</span>
					</div>
					<div className='flex items-center gap-3'>
						<ColorPicker value={theme.colorBorder ?? DEFAULT_THEME_COLORS.colorBorder} onChange={value => handleThemeColorChange('colorBorder', value)} />
						<span className='text-xs' style={{ color: '#777' }}>边框色</span>
					</div>
					<div className='flex items-center gap-3'>
						<ColorPicker value={theme.colorCard ?? DEFAULT_THEME_COLORS.colorCard} onChange={value => handleThemeColorChange('colorCard', value)} />
						<span className='text-xs' style={{ color: '#777' }}>卡片色</span>
					</div>
					<div className='flex items-center gap-3'>
						<ColorPicker value={theme.colorArticle ?? DEFAULT_THEME_COLORS.colorArticle} onChange={value => handleThemeColorChange('colorArticle', value)} />
						<span className='text-xs' style={{ color: '#777' }}>文章背景</span>
					</div>
				</div>
			</div>

			<div>
				<div className='flex items-start justify-between'>
					<div className='flex-1'>
						<SectionHeader>BACKGROUND_COLORS</SectionHeader>
					</div>
					<button
						type='button'
						onClick={handleAddColor}
						className='mt-6 rounded-lg border bg-transparent px-3 py-1.5 text-xs whitespace-nowrap transition-colors hover:border-[var(--color-brand)] hover:text-white'
						style={{ borderColor: 'var(--color-border)', color: '#888' }}>
						+ 添加颜色
					</button>
				</div>
				<div className='flex gap-3'>
					{formData.backgroundColors.map((color, index) => (
						<div key={index} className='flex items-center gap-2'>
							<div className='group relative'>
								<ColorPicker value={color} onChange={value => handleColorChange(index, value)} />
								{formData.backgroundColors.length > 1 && (
									<button
										onClick={() => handleRemoveColor(index)}
										className='absolute -top-1 -right-2 rounded-lg border bg-black/70 text-xs whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100'
										style={{ borderColor: 'var(--color-border)', color: '#888' }}>
										<XIcon className='size-3' />
									</button>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
