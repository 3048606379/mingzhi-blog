'use client'

import { useEffect, useState } from 'react'
import { HudPageHeader, HudRow } from '@/components/hud-page'
import { ProjectCard, type Project } from './components/project-card'
import type { ImageItem } from './components/image-upload-dialog'
import { pushProjects } from './services/push-projects'
import { useEditMode } from '@/hooks/use-edit-mode'
import { toast } from 'sonner'

const btnBase = 'border bg-transparent px-4 py-2 text-xs tracking-[0.15em] transition-colors disabled:opacity-40'

export default function ProjectsPage() {
	const [projects, setProjects] = useState<Project[]>([])
	const [original, setOriginal] = useState<Project[]>([])
	const [imageItems, setImageItems] = useState<Map<string, ImageItem>>(new Map())
	const [saving, setSaving] = useState(false)
	const { isEditMode, editLabel, setIsEditMode } = useEditMode()

	useEffect(() => {
		fetch('/data/projects/list.json').then(r => {
			if (r.ok) return r.json()
			return null
		}).then(data => {
			if (data && Array.isArray(data) && data.length > 0) {
				setProjects(data)
				setOriginal(data)
			}
		}).catch(() => {})
	}, [])

	const handleUpdate = (project: Project, oldProject: Project, imageItem?: ImageItem) => {
		if (imageItem) {
			setImageItems(prev => {
				const next = new Map(prev)
				next.set(oldProject.url, imageItem)
				return next
			})
		}
		setProjects(prev => prev.map(p => (p.url === oldProject.url ? project : p)))
	}

	const handleDelete = (project: Project) => {
		setProjects(prev => prev.filter(p => p.url !== project.url))
	}

	const handleSave = async () => {
		setSaving(true)
		try {
			await pushProjects({ projects, imageItems })
			setOriginal(projects)
			setImageItems(new Map())
			setIsEditMode(false)
		} catch (error: any) {
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setSaving(false)
		}
	}

	const handleCancel = () => {
		setProjects(original)
		setImageItems(new Map())
		setIsEditMode(false)
	}

	return (
		<>
			<div className='flex items-start justify-between gap-4'>
				<HudPageHeader title='PROJECTS' subtitle={`${projects.length} ITEMS`} />
				<div className='flex items-center gap-2 pt-1'>
					{isEditMode && (
						<>
							<span className='text-[9px] tracking-[0.3em]' style={{ color: 'var(--color-brand)', animation: 'hud-row-in 0.3s ease both' }}>
								· {editLabel}
								<span style={{ animation: 'splash-blink 0.6s step-end infinite' }}>▋</span>
							</span>
							<button
								className={`${btnBase} hover:border-[var(--color-brand)] hover:text-white`}
								style={{ borderColor: 'var(--color-border)', color: '#888', animation: 'hud-row-in 0.3s ease 0.1s both' }}
								onClick={handleCancel}
								disabled={saving}>
								&gt; 取消
							</button>
							<button
								className={`${btnBase} hover:bg-[rgba(167,139,250,0.1)]`}
								style={{ borderColor: 'var(--color-brand)', color: 'var(--color-brand)', animation: 'hud-row-in 0.3s ease 0.18s both' }}
								onClick={handleSave}
								disabled={saving}>
								&gt; {saving ? '保存中...' : '保存'}
							</button>
						</>
					)}
				</div>
			</div>

			{isEditMode ? (
				<div style={{ animation: 'hud-row-in 0.4s ease both' }}>
					<div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
						{projects.map(project => (
							<ProjectCard key={project.url} project={project} isEditMode onUpdate={handleUpdate} onDelete={() => handleDelete(project)} />
						))}
					</div>
					{projects.length === 0 && (
						<div className='mt-12 text-center text-xs tracking-[0.2em]' style={{ color: '#555' }}>
							&gt; 暂无项目，按 Ctrl + . 进入编辑模式后管理
						</div>
					)}
				</div>
			) : (
				<div className='flex flex-col'>
					{projects.map((project, i) => (
						<HudRow
							key={project.name}
							index={String(i + 1).padStart(2, '0')}
							title={project.name}
							desc={project.description}
							meta={String(project.year)}
							delay={i * 60}
							href={project.url || project.github || '/'}
							external
						/>
					))}
					{projects.length === 0 && (
						<div className='text-xs tracking-[0.2em]' style={{ color: '#555' }}>
							&gt; 暂无项目
						</div>
					)}
				</div>
			)}
		</>
	)
}
