import { combineRgb, type CompanionFeedbackDefinitions, type CompanionFeedbackSchema } from '@companion-module/base'

import type ModuleInstance from './main.js'

type SourceFeedbackOptions = { source: string }

export enum FeedbackId {
	SourceInPreview = 'source_in_preview',
	SourceInProgram = 'source_in_program',
}

export type FeedbacksSchema = {
	[FeedbackId.SourceInPreview]: CompanionFeedbackSchema<SourceFeedbackOptions> & { type: 'boolean' }
	[FeedbackId.SourceInProgram]: CompanionFeedbackSchema<SourceFeedbackOptions> & { type: 'boolean' }
}

export function UpdateFeedbacks(self: ModuleInstance): void {
	const feedbacks: CompanionFeedbackDefinitions<FeedbacksSchema> = {
		[FeedbackId.SourceInPreview]: {
			type: 'boolean',
			name: 'Source is Preview',
			description: 'Change button style when the selected source is active in preview.',
			defaultStyle: {
				bgcolor: combineRgb(0, 160, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [sourceField()],
			callback: ({ options }) => self.isSourcePreview(options.source),
		},
		[FeedbackId.SourceInProgram]: {
			type: 'boolean',
			name: 'Source is Program',
			description: 'Change button style when the selected source is active in program.',
			defaultStyle: {
				bgcolor: combineRgb(200, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [sourceField()],
			callback: ({ options }) => self.isSourceProgram(options.source),
		},
	}

	self.setFeedbackDefinitions(feedbacks)
}

function sourceField() {
	return {
		type: 'textinput' as const,
		id: 'source' as const,
		label: 'Source',
		default: '1',
		useVariables: true,
	}
}
