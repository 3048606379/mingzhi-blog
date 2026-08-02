import { NextRequest } from 'next/server'
import fsPromises from 'fs/promises'
import path from 'path'

const LIKES_FILE = path.join(process.cwd(), 'public', 'data', 'likes.json')
const RATE_FILE = path.join(process.cwd(), 'data', 'likes-rate.json')
const DAY_LIMIT = 100

// 内存互斥锁:串行化所有写操作,防止并发 +1 丢失计数
let lockChain: Promise<unknown> = Promise.resolve()
function withLock<T>(fn: () => Promise<T>): Promise<T> {
	const run = lockChain.then(fn, fn)
	lockChain = run.then(
		() => undefined,
		() => undefined
	)
	return run
}

async function readJsonSafe<T>(file: string): Promise<T> {
	try {
		return JSON.parse(await fsPromises.readFile(file, 'utf-8'))
	} catch {
		return {} as T
	}
}

// 临时文件 + rename 原子写入,避免读到写一半的损坏文件
async function atomicWrite(file: string, data: unknown) {
	await fsPromises.mkdir(path.dirname(file), { recursive: true })
	const tmp = `${file}.${process.pid}.tmp`
	await fsPromises.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8')
	await fsPromises.rename(tmp, file)
}

// 取真实客户端 IP:优先 x-real-ip(宝塔/nginx 会覆盖为 remote_addr,客户端伪造无效),
// 其次取 x-forwarded-for 最右一项(代理追加的真实 IP,客户端只能伪造自己加在前面的项)
function getClientIp(req: NextRequest): string {
	const real = req.headers.get('x-real-ip')
	if (real && real.trim()) return real.trim()
	const xff = req.headers.get('x-forwarded-for')
	if (xff) {
		const parts = xff
			.split(',')
			.map(s => s.trim())
			.filter(Boolean)
		if (parts.length > 0) return parts[parts.length - 1]
	}
	return 'unknown'
}

// slug 白名单校验:只允许字母数字 _ . - ,长度 ≤100,防异常 key 撑爆数据文件
function normalizeSlug(raw: string | null): string | null {
	if (!raw) return null
	const slug = raw.trim().slice(0, 100)
	if (!slug || !/^[\w.-]{1,100}$/.test(slug)) return null
	return slug
}

const today = () => new Date().toISOString().slice(0, 10)

export async function GET(request: NextRequest) {
	const slug = normalizeSlug(request.nextUrl.searchParams.get('slug'))
	if (!slug) return Response.json({ error: 'Invalid slug' }, { status: 400 })

	const counts = await readJsonSafe<Record<string, number>>(LIKES_FILE)
	return Response.json({ count: counts[slug] ?? 0 })
}

export async function POST(request: NextRequest) {
	const slug = normalizeSlug(request.nextUrl.searchParams.get('slug'))
	if (!slug) return Response.json({ error: 'Invalid slug' }, { status: 400 })

	const ip = getClientIp(request)
	const date = today()

	return withLock(async () => {
		const counts = await readJsonSafe<Record<string, number>>(LIKES_FILE)
		const current = counts[slug] ?? 0

		// 限流 1:同 IP 同 slug 每天只能点赞一次
		// 限流 2:同 IP 每天全站点赞总量上限(防脚本刷全站)
		const rate = await readJsonSafe<Record<string, Record<string, Record<string, number>>>>(RATE_FILE)
		const byIp = rate[date]?.[ip] ?? {}
		if (byIp[slug] > 0) {
			return Response.json({ reason: 'rate_limited', count: current }, { status: 429 })
		}
		const totalToday = Object.values(byIp).reduce((a, b) => a + b, 0)
		if (totalToday >= DAY_LIMIT) {
			return Response.json({ reason: 'rate_limited', count: current }, { status: 429 })
		}

		// 计数 +1 并原子落盘
		counts[slug] = current + 1
		await atomicWrite(LIKES_FILE, counts)

		// 记录限流痕迹
		const nextDay = { ...(rate[date] ?? {}), [ip]: { ...byIp, [slug]: 1 } }
		await atomicWrite(RATE_FILE, { ...rate, [date]: nextDay })

		return Response.json({ count: counts[slug] })
	})
}
