import { InstanceStatus } from '@companion-module/base'

import type ModuleInstance from './main.js'

type ApiParams = Record<string, string | number | boolean | undefined>
type ApiRequestOptions = {
	logErrors?: boolean
}

export async function requestPtzLiveApi(
	self: ModuleInstance,
	endpoint: string,
	params: ApiParams = {},
	options: ApiRequestOptions = {},
): Promise<unknown> {
	const baseUrl = getBaseUrl(self.config.host, self.config.port)
	const url = new URL(`/api/${endpoint}`, baseUrl)

	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== '') {
			url.searchParams.set(key, String(value))
		}
	}

	try {
		const response = await fetch(url, {
			method: 'GET',
			headers: getHeaders(self.config.apiToken),
		})

		const body = await readResponseBody(response)

		if (!response.ok) {
			const message = typeof body === 'string' && body.length > 0 ? body : response.statusText
			throw new Error(`PTZ Live returned ${response.status}: ${message}`)
		}

		self.updateStatus(InstanceStatus.Ok)
		return body
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		self.updateStatus(InstanceStatus.ConnectionFailure, message)
		if (options.logErrors !== false) {
			self.log('error', message)
		}
		throw error
	}
}

function getBaseUrl(host: string, port: number): string {
	const trimmedHost = host.trim()
	const protocolHost = /^https?:\/\//i.test(trimmedHost) ? trimmedHost : `http://${trimmedHost}`
	const url = new URL(protocolHost)
	url.port = String(port)
	return url.toString()
}

function getHeaders(apiToken: string | undefined): Record<string, string> | undefined {
	const token = apiToken?.trim()
	if (!token) {
		return undefined
	}

	return {
		Authorization: `Bearer ${token}`,
	}
}

async function readResponseBody(response: Response): Promise<unknown> {
	const text = await response.text()
	if (!text) {
		return undefined
	}

	try {
		return JSON.parse(text) as unknown
	} catch {
		return text
	}
}
