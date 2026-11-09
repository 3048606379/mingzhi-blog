'use client'

import { useEffect, useState } from 'react'
import { HudPageHeader } from '@/components/hud-page'

type ServerStatus = {
	time: string
	host: {
		name: string
		platform: string
		release: string
		cores: number
		uptime: number
		load: number[]
	}
	cpu: number | null
	memory: {
		total: number
		used: number
		available: number
		percent: number
		swap: { total: number; used: number; percent: number }
	}
	disk: { total: number; used: number; free: number; percent: number } | null
	network: { rxTotal: number; txTotal: number; rxRate: number; txRate: number } | null
	processes: { pid: number; name: string; rss: number }[]
	containers: { name: string; image: string; status: string; memory: number; cpu: number }[]
	containersUpdated: number | null
}

const REFRESH_MS = 5000

function formatBytes(bytes: number, decimals = 1): string {
	if (!bytes || bytes < 0) return '0 B'
	const units = ['B', 'KB', 'MB', 'GB', 'TB']
	let value = bytes
	let i = 0
	while (value >= 1024 && i < units.length - 1) {
		value /= 1024
		i++
	}
	return `${value.toFixed(i === 0 ? 0 : decimals)} ${units[i]}`
}

function formatRate(bytes: number): string {
	return `${formatBytes(bytes)}/s`
}

function formatUptime(seconds: number): string {
	const d = Math.floor(seconds / 86400)
	const h = Math.floor((seconds % 86400) / 3600)
	const m = Math.floor((seconds % 3600) / 60)
	if (d > 0) return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`
	if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
	return `${m}m`
}

function accentFor(percent: number): string {
	if (percent >= 85) return '#f87171'
	if (percent >= 70) return '#fbbf24'
	return 'var(--color-brand)'
}

function Metric({ label, percent, detail, delay = 0 }: { label: string; percent: number; detail: string; delay?: number }) {
	const accent = accentFor(percent)
	return (
		<div
			className='border p-4'
			style={{
				borderColor: 'var(--color-border)',
				background: 'rgba(0,0,0,0.62)',
				animation: `hud-row-in 0.4s ease ${delay}ms both`
			}}
		>
			<div className='flex items-baseline justify-between gap-3'>
				<span className='text-[9px] tracking-[0.35em]' style={{ color: '#555' }}>
					{label}
				</span>
				<span className='text-xl tabular-nums' style={{ color: accent }}>
					{percent.toFixed(1)}
					<span className='ml-0.5 text-[10px]' style={{ color: '#555' }}>
						%
					</span>
				</span>
			</div>
			<div className='mt-3 h-[3px] w-full overflow-hidden' style={{ backgroundColor: '#151515' }}>
				<div
					className='h-full transition-all duration-700 ease-out'
					style={{ width: `${Math.min(100, Math.max(0, percent))}%`, backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }}
				/>
			</div>
			<div className='mt-2 truncate text-[10px] tracking-[0.08em]' style={{ color: '#666' }}>
				{detail}
			</div>
		</div>
	)
}

function Stat({ label, value, delay = 0 }: { label: string; value: string; delay?: number }) {
	return (
		<div
			className='flex flex-col gap-1 border px-3 py-2'
			style={{ borderColor: 'var(--color-border)', background: 'rgba(0,0,0,0.62)', animation: `hud-row-in 0.4s ease ${delay}ms both` }}
		>
			<span className='text-[9px] tracking-[0.3em]' style={{ color: '#444' }}>
				{label}
			</span>
			<span className='truncate text-xs tabular-nums' style={{ color: '#bbb' }}>
				{value}
			</span>
		</div>
	)
}

function Section({ title, meta, children, delay = 0 }: { title: string; meta?: string; children: React.ReactNode; delay?: number }) {
	return (
		<section className='mt-10' style={{ animation: `hud-row-in 0.4s ease ${delay}ms both` }}>
			<div className='mb-1 flex items-baseline justify-between gap-4'>
				<h2 className='text-[10px] tracking-[0.4em]' style={{ color: '#666' }}>
					{title}
				</h2>
				{meta && (
					<span className='text-[9px] tracking-[0.25em]' style={{ color: '#3a3a3a' }}>
						{meta}
					</span>
				)}
			</div>
			<div className='h-px w-full' style={{ background: 'linear-gradient(to right, var(--color-border), transparent)' }} />
			{children}
		</section>
	)
}

function Row({ index, name, meta, tone = '#666', dot }: { index?: string; name: string; meta: string; tone?: string; dot?: string }) {
	return (
		<div className='flex items-baseline gap-3 border-b py-2.5' style={{ borderColor: 'var(--color-border)' }}>
			{index && (
				<span className='w-6 shrink-0 text-[10px]' style={{ color: '#3a3a3a' }}>
					{index}
				</span>
			)}
			{dot && (
				<span className='shrink-0 text-[8px]' style={{ color: dot, animation: dot === '#4ade80' ? undefined : 'splash-blink 1.6s step-end infinite' }}>
					●
				</span>
			)}
			<span className='min-w-0 flex-1 truncate text-xs' style={{ color: '#bbb' }}>
				{name}
			</span>
			<span className='shrink-0 text-[10px] tabular-nums tracking-[0.08em]' style={{ color: tone }}>
				{meta}
			</span>
		</div>
	)
}

export default function StatusPage() {
	const [data, setData] = useState<ServerStatus | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

	useEffect(() => {
		let timer: ReturnType<typeof setInterval> | null = null
		let cancelled = false

		const load = async () => {
			try {
				const res = await fetch('/api/server-status', { cache: 'no-store' })
				if (!res.ok) throw new Error(`HTTP ${res.status}`)
				const json = (await res.json()) as ServerStatus
				if (cancelled) return
				setData(json)
				setUpdatedAt(new Date(json.time))
				setError(null)
			} catch (err: any) {
				if (cancelled) return
				setError(err?.message || 'unreachable')
			}
		}

		const start = () => {
			if (timer) return
			load()
			timer = setInterval(load, REFRESH_MS)
		}

		const stop = () => {
			if (!timer) return
			clearInterval(timer)
			timer = null
		}

		const onVisibility = () => {
			if (document.hidden) stop()
			else start()
		}

		start()
		document.addEventListener('visibilitychange', onVisibility)
		return () => {
			cancelled = true
			stop()
			document.removeEventListener('visibilitychange', onVisibility)
		}
	}, [])

	const online = !!data && !error
	const cpu = data?.cpu ?? 0
	const mem = data?.memory
	const swap = mem?.swap
	const disk = data?.disk
	const net = data?.network

	return (
		<div className='pb-6'>
			<HudPageHeader title='STATUS' subtitle='SERVER TELEMETRY' />

			<div className='mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[9px] tracking-[0.25em]' style={{ color: '#555' }}>
				<span className='flex items-center gap-2' style={{ color: online ? '#4ade80' : '#f87171' }}>
					<span>●</span>
					{online ? 'LIVE' : 'OFFLINE'}
				</span>
				<span>
					SYNC{' '}
					{updatedAt
						? updatedAt.toLocaleTimeString('zh-CN', { hour12: false })
						: '--:--:--'}
				</span>
				<span className='truncate'>{data?.host.name ?? 'UNKNOWN HOST'}</span>
				<span>{data ? `${data.host.cores} CORES` : '-- CORES'}</span>
			</div>

			<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
				<Metric label='CPU' percent={cpu} detail={data ? `LOAD ${data.host.load.map(v => v.toFixed(2)).join('  ')}` : 'WAITING FOR SIGNAL'} />
				<Metric
					label='MEMORY'
					percent={mem?.percent ?? 0}
					detail={mem ? `${formatBytes(mem.used)} / ${formatBytes(mem.total)} · AVAILABLE ${formatBytes(mem.available)}` : 'NO DATA'}
					delay={60}
				/>
				<Metric
					label='SWAP'
					percent={swap?.percent ?? 0}
					detail={swap && swap.total > 0 ? `${formatBytes(swap.used)} / ${formatBytes(swap.total)}` : 'NOT CONFIGURED'}
					delay={120}
				/>
				<Metric
					label='DISK /'
					percent={disk?.percent ?? 0}
					detail={disk ? `${formatBytes(disk.used)} / ${formatBytes(disk.total)} · FREE ${formatBytes(disk.free)}` : 'NO DATA'}
					delay={180}
				/>
			</div>

			<div className='mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4'>
				<Stat label='UPTIME' value={data ? formatUptime(data.host.uptime) : '--'} delay={240} />
				<Stat label='LOAD 1/5/15' value={data ? data.host.load.map(v => v.toFixed(2)).join(' / ') : '--'} delay={280} />
				<Stat label='PLATFORM' value={data ? `${data.host.platform} ${data.host.release}` : '--'} delay={320} />
				<Stat label='PROCESSES' value={data ? `${data.processes.length} TRACKED` : '--'} delay={360} />
			</div>

			<Section title='NETWORK' meta='AGGREGATE · EXCLUDING LOOPBACK' delay={200}>
				<Row index='01' name='↓ DOWNLINK' meta={net ? `${formatRate(net.rxRate)}  ·  ${formatBytes(net.rxTotal)} TOTAL` : 'NO DATA'} tone={net ? '#bbb' : '#444'} />
				<Row index='02' name='↑ UPLINK' meta={net ? `${formatRate(net.txRate)}  ·  ${formatBytes(net.txTotal)} TOTAL` : 'NO DATA'} tone={net ? '#bbb' : '#444'} />
			</Section>

			<Section title='CONTAINERS' meta={data ? `${data.containers.length} ACTIVE` : 'NO DATA'} delay={260}>
				{data && data.containers.length > 0 ? (
					data.containers.map((c, i) => (
						<Row
							key={c.name}
							index={String(i + 1).padStart(2, '0')}
							name={c.name}
							meta={`${c.status}  ·  ${formatBytes(c.memory)}`}
							dot={c.status.toLowerCase().startsWith('up') ? '#4ade80' : '#f87171'}
						/>
					))
				) : (
					<div className='py-3 text-[10px] tracking-[0.15em]' style={{ color: '#3a3a3a' }}>
						&gt; NO CONTAINER TELEMETRY
					</div>
				)}
			</Section>

			<Section title='TOP PROCESSES' meta='BY RESIDENT MEMORY' delay={320}>
				{data && data.processes.length > 0 ? (
					data.processes.map((p, i) => <Row key={p.pid} index={String(i + 1).padStart(2, '0')} name={p.name} meta={formatBytes(p.rss)} />)
				) : (
					<div className='py-3 text-[10px] tracking-[0.15em]' style={{ color: '#3a3a3a' }}>
						&gt; PROCESS TELEMETRY UNAVAILABLE
					</div>
				)}
			</Section>

			<div className='mt-10 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[9px] tracking-[0.2em]' style={{ borderColor: 'var(--color-border)', color: '#333' }}>
				<span>&gt; POLL {REFRESH_MS / 1000}S · /PROC + DOCKER</span>
				<span style={{ color: error ? '#f87171' : '#333' }}>{error ? `SIGNAL LOST: ${error}` : 'TELEMETRY NOMINAL'}</span>
			</div>
		</div>
	)
}
