import { InstanceBase, InstanceStatus, type SomeCompanionConfigField } from '@companion-module/base'

import { requestPtzLiveApi } from './api.js'
import { UpdateActions, type ActionsSchema } from './actions.js'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { FeedbackId, UpdateFeedbacks, type FeedbacksSchema } from './feedbacks.js'
import { UpdatePresets } from './presets.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateVariableDefinitions, type VariablesSchema } from './variables.js'

export type ModuleSchema = {
	config: ModuleConfig
	secrets: undefined
	actions: ActionsSchema
	feedbacks: FeedbacksSchema
	variables: VariablesSchema
}

export { UpgradeScripts }

type SourceState = {
	id?: string
	index?: number
	name?: string
	ndiName?: string
	preview?: boolean
	program?: boolean
}

export default class ModuleInstance extends InstanceBase<ModuleSchema> {
	config!: ModuleConfig
	private sourcePollTimer: ReturnType<typeof setInterval> | undefined
	private sources: SourceState[] = []

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config

		this.updateStatus(InstanceStatus.Ok)
		this.updateActions()
		this.updateFeedbacks()
		this.updatePresets()
		this.updateVariableDefinitions()
		this.startSourcePolling()
	}

	async destroy(): Promise<void> {
		this.stopSourcePolling()
		this.log('debug', 'destroy')
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config
		this.updateStatus(InstanceStatus.Ok)
		this.startSourcePolling()
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updatePresets(): void {
		UpdatePresets(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}

	isSourcePreview(source: string): boolean {
		return this.findSource(source)?.preview === true
	}

	isSourceProgram(source: string): boolean {
		return this.findSource(source)?.program === true
	}

	markSourcePreview(source: string): void {
		this.markSourceState(source, 'preview')
	}

	markSourceProgram(source: string): void {
		this.markSourceState(source, 'program')
	}

	private startSourcePolling(): void {
		this.stopSourcePolling()
		void this.pollSources()
		this.sourcePollTimer = setInterval(() => void this.pollSources(), 1000)
	}

	private stopSourcePolling(): void {
		if (this.sourcePollTimer) {
			clearInterval(this.sourcePollTimer)
			this.sourcePollTimer = undefined
		}
	}

	private async pollSources(): Promise<void> {
		try {
			const response = await requestPtzLiveApi(this, 'sources', {}, { logErrors: false })
			if (!Array.isArray(response)) {
				return
			}

			const nextSources = response.filter(isSourceState)
			if (JSON.stringify(nextSources) !== JSON.stringify(this.sources)) {
				this.sources = nextSources
				this.checkFeedbacks(FeedbackId.SourceInPreview, FeedbackId.SourceInProgram)
			}
		} catch {
			// Status is updated by the API helper. Avoid logging every poll while PTZ Live is offline.
		}
	}

	private findSource(source: string): SourceState | undefined {
		const value = String(source).trim()
		return this.sources.find((item) => matchesSource(item, value))
	}

	private markSourceState(source: string, state: 'preview' | 'program'): void {
		const value = String(source).trim()
		let matched = false

		this.sources = this.sources.map((item) => {
			const isMatch = matchesSource(item, value)
			matched ||= isMatch
			return {
				...item,
				[state]: isMatch,
			}
		})

		if (!matched) {
			this.sources.push(createSourceState(value, state))
		}

		this.checkFeedbacks(FeedbackId.SourceInPreview, FeedbackId.SourceInProgram)
	}
}

function isSourceState(value: unknown): value is SourceState {
	if (!value || typeof value !== 'object') {
		return false
	}

	const source = value as SourceState
	return (
		(source.id === undefined || typeof source.id === 'string') &&
		(source.index === undefined || typeof source.index === 'number') &&
		(source.name === undefined || typeof source.name === 'string') &&
		(source.ndiName === undefined || typeof source.ndiName === 'string') &&
		(source.preview === undefined || typeof source.preview === 'boolean') &&
		(source.program === undefined || typeof source.program === 'boolean')
	)
}

function matchesSource(source: SourceState, value: string): boolean {
	return (
		source.id === value ||
		source.name === value ||
		source.ndiName === value ||
		(source.index !== undefined && String(source.index) === value)
	)
}

function createSourceState(value: string, state: 'preview' | 'program'): SourceState {
	const numericIndex = Number(value)
	const isIndex = Number.isInteger(numericIndex) && numericIndex > 0

	return {
		id: value,
		index: isIndex ? numericIndex : undefined,
		name: value,
		ndiName: value,
		preview: state === 'preview',
		program: state === 'program',
	}
}
