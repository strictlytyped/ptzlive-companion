import type { CompanionActionDefinitions, CompanionActionSchema } from '@companion-module/base'

import { requestPtzLiveApi } from './api.js'
import type ModuleInstance from './main.js'

type EmptyOptions = Record<string, never>
type SourceOptions = { source: string }
type ProcessorOptions = { source: string; processor: string; enabled: boolean }
type GraphicsOptions = {
	mode: 'global' | 'processor'
	source: string
	processor: string
	layer: string
	preview: boolean
	program: boolean
	show: boolean
}
type DeckSelectOptions = { deck: string; media: string }
type PresetOptions = { source: string; preset: string; includeSpeed: boolean; speed: number }

export enum ActionId {
	SetPreview = 'set_preview',
	SetProgram = 'set_program',
	Cut = 'cut',
	Auto = 'auto',
	EnableGraphicsLayer = 'enable_graphics_layer',
	EnableProcessor = 'enable_processor',
	SelectDeckMedia = 'select_deck_media',
	RecallPreset = 'recall_preset',
}

export type ActionsSchema = {
	[ActionId.SetPreview]: CompanionActionSchema<SourceOptions>
	[ActionId.SetProgram]: CompanionActionSchema<SourceOptions>
	[ActionId.Cut]: CompanionActionSchema<EmptyOptions>
	[ActionId.Auto]: CompanionActionSchema<EmptyOptions>
	[ActionId.EnableGraphicsLayer]: CompanionActionSchema<GraphicsOptions>
	[ActionId.EnableProcessor]: CompanionActionSchema<ProcessorOptions>
	[ActionId.SelectDeckMedia]: CompanionActionSchema<DeckSelectOptions>
	[ActionId.RecallPreset]: CompanionActionSchema<PresetOptions>
}

export function UpdateActions(self: ModuleInstance): void {
	const actions: CompanionActionDefinitions<ActionsSchema> = {
		[ActionId.SetPreview]: {
			name: 'Set Preview',
			options: [sourceField('Source')],
			callback: async ({ options }) => {
				await requestPtzLiveApi(self, 'preview', { source: options.source })
				self.markSourcePreview(options.source)
			},
		},
		[ActionId.SetProgram]: {
			name: 'Set Program',
			options: [sourceField('Source')],
			callback: async ({ options }) => {
				await requestPtzLiveApi(self, 'program', { source: options.source })
				self.markSourceProgram(options.source)
			},
		},
		[ActionId.Cut]: {
			name: 'Cut',
			options: [],
			callback: async () => {
				await requestPtzLiveApi(self, 'cut')
			},
		},
		[ActionId.Auto]: {
			name: 'Auto',
			options: [],
			callback: async () => {
				await requestPtzLiveApi(self, 'auto')
			},
		},
		[ActionId.EnableGraphicsLayer]: {
			name: 'Enable Graphics Layer',
			options: [
				modeField('Graphics Scope', 'global'),
				{
					type: 'textinput',
					id: 'source',
					label: 'Source',
					default: '1',
					useVariables: true,
					isVisibleExpression: '$(options:mode) == "processor"',
				},
				{
					type: 'textinput',
					id: 'processor',
					label: 'Processor',
					default: '1',
					useVariables: true,
					isVisibleExpression: '$(options:mode) == "processor"',
				},
				{
					type: 'textinput',
					id: 'layer',
					label: 'Layer',
					default: '1',
					useVariables: true,
				},
				{
					type: 'checkbox',
					id: 'preview',
					label: 'Preview',
					default: true,
					isVisibleExpression: '$(options:mode) == "global"',
				},
				{
					type: 'checkbox',
					id: 'program',
					label: 'Program',
					default: false,
					isVisibleExpression: '$(options:mode) == "global"',
				},
				{
					type: 'checkbox',
					id: 'show',
					label: 'Show',
					default: true,
					isVisibleExpression: '$(options:mode) == "processor"',
				},
			],
			callback: async ({ options }) => {
				await requestPtzLiveApi(
					self,
					'graphics_enable',
					options.mode === 'global'
						? {
								layer: options.layer,
								preview: options.preview,
								program: options.program,
							}
						: {
								source: options.source,
								processor: options.processor,
								layer: options.layer,
								show: options.show,
							},
				)
			},
		},
		[ActionId.EnableProcessor]: {
			name: 'Enable Processor',
			options: [
				sourceField('Source'),
				{
					type: 'textinput',
					id: 'processor',
					label: 'Processor',
					default: '1',
					useVariables: true,
				},
				{
					type: 'checkbox',
					id: 'enabled',
					label: 'Enabled',
					default: true,
				},
			],
			callback: async ({ options }) => {
				await requestPtzLiveApi(self, 'processor_enable', {
					source: options.source,
					processor: options.processor,
					enabled: options.enabled,
				})
			},
		},
		[ActionId.SelectDeckMedia]: {
			name: 'Select Deck Media',
			options: [
				deckField(),
				{
					type: 'textinput',
					id: 'media',
					label: 'Media',
					default: '1',
					useVariables: true,
				},
			],
			callback: async ({ options }) => {
				await requestPtzLiveApi(self, 'deck_select', {
					deck: options.deck,
					media: options.media,
				})
			},
		},
		[ActionId.RecallPreset]: {
			name: 'Recall Preset',
			options: [
				sourceField('Source'),
				{
					type: 'textinput',
					id: 'preset',
					label: 'Preset',
					default: '1',
					useVariables: true,
				},
				{
					type: 'checkbox',
					id: 'includeSpeed',
					label: 'Set Speed',
					default: false,
					disableAutoExpression: true,
				},
				{
					type: 'number',
					id: 'speed',
					label: 'Speed',
					default: 0.5,
					min: 0,
					max: 1,
					step: 0.01,
					range: true,
					isVisibleExpression: '$(options:includeSpeed) == true',
				},
			],
			callback: async ({ options }) => {
				await requestPtzLiveApi(self, 'preset', {
					source: options.source,
					preset: options.preset,
					speed: options.includeSpeed ? options.speed : undefined,
				})
			},
		},
	}

	self.setActionDefinitions(actions)
}

function sourceField(label: string) {
	return {
		type: 'textinput' as const,
		id: 'source' as const,
		label,
		default: '1',
		useVariables: true,
	}
}

function deckField() {
	return {
		type: 'textinput' as const,
		id: 'deck' as const,
		label: 'Deck',
		default: '1',
		useVariables: true,
	}
}

function modeField(label: string, defaultValue: 'global' | 'processor') {
	return {
		type: 'dropdown' as const,
		id: 'mode' as const,
		label,
		default: defaultValue,
		choices: [
			{ id: 'global' as const, label: 'Global Layer' },
			{ id: 'processor' as const, label: 'Processor Layer' },
		],
	}
}
