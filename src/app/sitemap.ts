import { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-static'

function loadBlogIndex() {
	try {
		const p = path.join(process.cwd(), 'public', 'blogs', 'index.json')
		if (fs.existsSync(p)) {
			return JSON.parse(fs.readFileSync(p, 'utf-8'))
		}
	} catch {}
	return []
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = process.env.SITE_URL ? process.env.SITE_URL : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'

	console.log(`[Sitemap] Generating for: ${baseUrl}`)

	const posts = loadBlogIndex()

	const postEntries: MetadataRoute.Sitemap = posts.map((post: any) => ({
		url: `${baseUrl}/blog/${post.slug}`,
		lastModified: post.date ? new Date(post.date) : new Date(),
		changeFrequency: 'weekly' as const,
		priority: 0.8
	}))

	const staticEntries: MetadataRoute.Sitemap = [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: 'daily' as const,
			priority: 1
		}
	]

	return [...staticEntries, ...postEntries]
}
