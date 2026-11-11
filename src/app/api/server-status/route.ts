import { promises as fs } from 'fs'
import os from 'os'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const isLinux = process.platform === 'linux'
const DOCKER_STATUS_FILE = '/var/lib/blog-status/docker.json'
const PROCESS_LIMIT = 8

type CpuSample = { idle: number; total: number }
type NetSample = { rx: number; tx: number; at: number }

let prevCpu: CpuSample | null = null
let prevWinCpu: CpuSample | null = null
let prevNet: NetSample | null = null
let payloadCache: { at: number; body: unknown } | null = null
const CACHE_MS = 900

const pct = (used: number, total: number) => (total > 0 ? Math.max(0, Math.min(100, (used / total) * 100)) : 0)

async function readLinuxCpu(): Promise<CpuSample | null> {
	try {
		const text = await fs.readFile('/proc/stat', 'utf8')
		const line = text.split('\n').find(l => l.startsWith('cpu '))
		if (!line) return null
		const nums = line.trim().split(/\s+/).slice(1, 9).map(Number)
		return { idle: (nums[3] ?? 0) + (nums[4] ?? 0), total: nums.reduce((a, b) => a + (b || 0), 0) }
	} catch {
		return null
	}
}

async function cpuUsage(): Promise<number | null> {
	if (isLinux) {
		const now = await readLinuxCpu()
		if (!now) return null
		if (!prevCpu) {
			prevCpu = now
			await new Promise(r => setTimeout(r, 200))
			return cpuUsage()
		}
		const dTotal = now.total - prevCpu.total
		const dIdle = now.idle - prevCpu.idle
		prevCpu = now
		if (dTotal <= 0) return null
		return Math.max(0, Math.min(100, (1 - dIdle / dTotal) * 100))
	}

	// 非 Linux（本地开发）：用 os.cpus() 的累计时间做差分
	const cpus = os.cpus()
	let idle = 0
	let total = 0
	for (const cpu of cpus) {
		idle += cpu.times.idle
		total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq
	}
	if (!prevWinCpu) {
		prevWinCpu = { idle, total }
		return null
	}
	const dTotal = total - prevWinCpu.total
	const dIdle = idle - prevWinCpu.idle
	prevWinCpu = { idle, total }
	if (dTotal <= 0) return null
	return Math.max(0, Math.min(100, (1 - dIdle / dTotal) * 100))
}

async function memory() {
	if (isLinux) {
		try {
			const text = await fs.readFile('/proc/meminfo', 'utf8')
			const kb = (key: string) => Number(new RegExp(`^${key}:\\s+(\\d+)`, 'm').exec(text)?.[1] ?? 0) * 1024
			const total = kb('MemTotal')
			const available = kb('MemAvailable')
			const swapTotal = kb('SwapTotal')
			const swapFree = kb('SwapFree')
			const used = Math.max(0, total - available)
			const swapUsed = Math.max(0, swapTotal - swapFree)
			return {
				total,
				used,
				available,
				percent: pct(used, total),
				swap: { total: swapTotal, used: swapUsed, percent: pct(swapUsed, swapTotal) }
			}
		} catch {
			// fall through to os fallback
		}
	}
	const total = os.totalmem()
	const free = os.freemem()
	const used = total - free
	return { total, used, available: free, percent: pct(used, total), swap: { total: 0, used: 0, percent: 0 } }
}

async function disk() {
	try {
		const root = isLinux ? '/' : `${process.env.SystemDrive || 'C:'}\\`
		const stat = await fs.statfs(root)
		const total = stat.blocks * stat.bsize
		const free = stat.bavail * stat.bsize
		const used = total - free
		return { total, used, free, percent: pct(used, total) }
	} catch {
		return null
	}
}

async function network() {
	if (!isLinux) return null
	try {
		const text = await fs.readFile('/proc/net/dev', 'utf8')
		let rx = 0
		let tx = 0
		for (const line of text.split('\n').slice(2)) {
			const idx = line.indexOf(':')
			if (idx < 0) continue
			const name = line.slice(0, idx).trim()
			if (!name || name === 'lo') continue
			const nums = line.slice(idx + 1).trim().split(/\s+/).map(Number)
			rx += nums[0] || 0
			tx += nums[8] || 0
		}
		const at = Date.now()
		let rxRate = 0
		let txRate = 0
		if (prevNet && at > prevNet.at) {
			const dt = (at - prevNet.at) / 1000
			rxRate = Math.max(0, (rx - prevNet.rx) / dt)
			txRate = Math.max(0, (tx - prevNet.tx) / dt)
		}
		prevNet = { rx, tx, at }
		return { rxTotal: rx, txTotal: tx, rxRate, txRate }
	} catch {
		return null
	}
}

async function processes() {
	if (!isLinux) return []
	try {
		const entries = await fs.readdir('/proc')
		const pids = entries.filter(e => /^\d+$/.test(e))
		const rows = await Promise.all(
			pids.map(async pid => {
				try {
					const status = await fs.readFile(`/proc/${pid}/status`, 'utf8')
					const name = /^Name:\s*(.+)$/m.exec(status)?.[1]?.trim()
					const rssKb = Number(/^VmRSS:\s*(\d+)\s*kB/m.exec(status)?.[1] ?? 0)
					if (!name || rssKb <= 0) return null
					return { pid: Number(pid), name: name.replace(/[^\w.\-:+ ]/g, '').slice(0, 28), rss: rssKb * 1024 }
				} catch {
					return null
				}
			})
		)
		return rows
			.filter((row): row is { pid: number; name: string; rss: number } => row !== null)
			.sort((a, b) => b.rss - a.rss)
			.slice(0, PROCESS_LIMIT)
	} catch {
		return []
	}
}

async function containers() {
	if (!isLinux) return { items: [], updated: null as number | null }
	try {
		const raw = await fs.readFile(DOCKER_STATUS_FILE, 'utf8')
		const parsed = JSON.parse(raw)
		if (!Array.isArray(parsed?.containers)) return { items: [], updated: null }
		const items = parsed.containers
			.slice(0, 12)
			.map((c: any) => ({
				name: String(c?.name ?? '').replace(/[^\w.\-]/g, '').slice(0, 32),
				image: String(c?.image ?? '').slice(0, 60),
				status: String(c?.status ?? '').slice(0, 40),
				memory: Number(c?.memory ?? 0) || 0,
				cpu: Number(c?.cpu ?? 0) || 0
			}))
			.filter((c: any) => c.name)
		return { items, updated: Number(parsed.updated) || null }
	} catch {
		return { items: [], updated: null }
	}
}

export async function GET() {
	const startedAt = Date.now()
	if (payloadCache && startedAt - payloadCache.at < CACHE_MS) {
		return Response.json(payloadCache.body, { headers: { 'cache-control': 'no-store' } })
	}

	const [cpu, mem, dsk, net, procs, docker] = await Promise.all([cpuUsage(), memory(), disk(), network(), processes(), containers()])

	const load = os.loadavg()

	const payload = {
		time: new Date().toISOString(),
		host: {
			name: os.hostname(),
			platform: process.platform,
			release: os.release(),
			cores: os.cpus().length,
			uptime: os.uptime(),
			load
		},
		cpu,
		memory: mem,
		disk: dsk,
		network: net,
		processes: procs,
		containers: docker.items,
		containersUpdated: docker.updated
	}

	payloadCache = { at: startedAt, body: payload }
	return Response.json(payload, { headers: { 'cache-control': 'no-store' } })
}
