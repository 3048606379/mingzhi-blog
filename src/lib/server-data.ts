import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'

export const DATA_DIR = path.join(process.cwd(), 'public', 'data')

export function getDataPath(...segments: string[]): string {
	return path.join(DATA_DIR, ...segments)
}

export async function ensureDir(dirPath: string): Promise<void> {
	await fsPromises.mkdir(dirPath, { recursive: true })
}

export async function readJson<T>(...segments: string[]): Promise<T | null> {
	const filePath = getDataPath(...segments)
	try {
		const content = await fsPromises.readFile(filePath, 'utf-8')
		return JSON.parse(content)
	} catch {
		return null
	}
}

export async function writeJson(...segments: [...string[], string]): Promise<void>
export async function writeJson(...segments: [...string[], any]): Promise<void>
export async function writeJson(...segments: any[]): Promise<void> {
	const data = segments.pop()
	const filePath = getDataPath(...segments)
	await ensureDir(path.dirname(filePath))
	await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export async function writeText(...segments: [...string[], string]): Promise<void> {
	const content = segments.pop() as string
	const filePath = getDataPath(...segments)
	await ensureDir(path.dirname(filePath))
	await fsPromises.writeFile(filePath, content, 'utf-8')
}

export async function writeBase64File(...segments: [...string[], string]): Promise<void> {
	const b64 = segments.pop() as string
	const filePath = getDataPath(...segments)
	await ensureDir(path.dirname(filePath))
	const buffer = Buffer.from(b64, 'base64')
	await fsPromises.writeFile(filePath, buffer)
}

export async function deleteDir(...segments: string[]): Promise<void> {
	const dirPath = getDataPath(...segments)
	try {
		await fsPromises.rm(dirPath, { recursive: true, force: true })
	} catch {
		// ignore if doesn't exist
	}
}

export async function listDir(...segments: string[]): Promise<string[]> {
	const dirPath = getDataPath(...segments)
	try {
		const entries = await fsPromises.readdir(dirPath, { withFileTypes: true })
		return entries
			.filter(e => e.isFile())
			.map(e => e.name)
	} catch {
		return []
	}
}
