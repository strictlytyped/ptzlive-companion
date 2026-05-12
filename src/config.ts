import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export type ModuleConfig = {
	host: string
	port: number
	apiToken?: string
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'PTZ Live Host',
			width: 8,
			regex: Regex.HOSTNAME,
			default: '127.0.0.1',
		},
		{
			type: 'number',
			id: 'port',
			label: 'Port',
			width: 4,
			min: 1,
			max: 65535,
			default: 8421,
		},
		{
			type: 'textinput',
			id: 'apiToken',
			label: 'API Token',
			width: 12,
			default: '',
		},
	]
}
