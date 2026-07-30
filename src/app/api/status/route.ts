import { NextRequest } from 'next/server'

const START_TIME = Date.now()

export async function GET(request: NextRequest) {
	return Response.json({
		startTime: new Date(START_TIME).toISOString(),
		uptime: Math.floor((Date.now() - START_TIME) / 1000)
	})
}
