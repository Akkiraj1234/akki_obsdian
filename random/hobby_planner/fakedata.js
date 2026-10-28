/**
 * Fake data for the Hobby Planner UI.
 *
 * Responsibilities:
 * - Hobby: retrieve hobby metadata.
 * - ActivityInfo: resolve slot assignments for a month.
 * - HobbyPlanner: reconstruct historical planner states and attach slots.
 * - getGraphData: retrieve daily activity totals for graph rendering.
 *
 * Reverse diffs restore older planner states from the latest snapshot.
 */

import { id } from "zod/locales";


export const FAKE_HOBBIES = {
	'hobby-coding': {
		name: 'Coding',
		createdAt: '2026-01-01T09:00:00',
		updatedAt: '2026-10-20T12:00:00',
		parentId: null,
		description: 'Building software and learning programming',
		unit: 'minutes',
		color: '#6366F1',
	},

	'hobby-leetcode': {
		name: 'LeetCode',
		createdAt: '2026-01-05T10:00:00',
		updatedAt: '2026-10-10T16:00:00',
		parentId: 'hobby-coding',
		description: 'Practicing algorithms and data structures',
		unit: 'problems',
		color: '#F59E0B',
	},

	'hobby-reading': {
		name: 'Book Reading',
		createdAt: '2026-02-01T10:00:00',
		updatedAt: '2026-10-01T10:00:00',
		parentId: null,
		description: 'Reading technical and personal development books',
		unit: 'pages',
		color: '#10B981',
	},

	'hobby-chess': {
		name: 'Chess',
		createdAt: '2026-01-10T12:00:00',
		updatedAt: '2026-06-15T12:00:00',
		parentId: null,
		description: 'Chess puzzles, tactics, and practice games',
		unit: 'minutes',
		color: '#8B5CF6',
	},

	'hobby-sketching': {
		name: 'Sketching',
		createdAt: '2026-03-01T12:00:00',
		updatedAt: '2026-10-05T12:00:00',
		parentId: null,
		description: 'Drawing and improving artistic skills',
		unit: 'minutes',
		color: '#EC4899',
	},

	'hobby-workout': {
		name: 'Home Workout',
		createdAt: '2026-03-05T07:00:00',
		updatedAt: '2026-10-22T07:00:00',
		parentId: null,
		description: 'Strength training and mobility',
		unit: 'minutes',
		color: '#EF4444',
	},

	'hobby-guitar': {
		name: 'Guitar Practice',
		createdAt: '2026-04-01T18:00:00',
		updatedAt: '2026-10-12T18:00:00',
		parentId: null,
		description: 'Practicing chords, technique, and songs',
		unit: 'minutes',
		color: '#06B6D4',
	},
};


/**
 * Hobby Planner
 *
 * Rules:
 * - `latest` stores the current sections, keyed by stable numeric-string IDs.
 * - `order` stores the display order of section IDs.
 * - `nextSectionId` generates IDs without reusing deleted IDs.
 * - `latestMonth` identifies the current snapshot month.
 * - `changes.<month>` stores the previous state needed to reconstruct that month.
 *
 * History actions:
 * - update: restore `previous`.
 * - create: remove the created section when reversing history.
 * - delete: restore `previous` at its saved `index`.
 *
 * Month keys represent the state to restore when moving backwards.
 * For example, `changes.sep` contains the changes to reverse
 * when reconstructing September from the October snapshot.
 */
export const HOBBY_PLANNER = {
	title: "Hobby Planner",
	description: "Skills, activities and personal growth manager",
	nextSectionId: 7,

	data: {
		2026: {
			latestMonth: "oct",
			order: ["1", "2", "4", "6"],

			latest: {
				"1": {
					title: "Programming & Skills",
					slotsAllow: 4,
					childAllow: true,
					treatChildAsSlot: true,
					modifiedAt: "2026-10",
				},

				"2": {
					title: "Creative Activities",
					slotsAllow: 3,
					childAllow: false,
					treatChildAsSlot: false,
					modifiedAt: "2026-04",
				},

				"4": {
					title: "Music",
					slotsAllow: 2,
					childAllow: true,
					treatChildAsSlot: false,
					modifiedAt: "2026-07",
				},

				"5": {
					title: "Reading & Learning",
					slotsAllow: 2,
					childAllow: true,
					treatChildAsSlot: true,
					modifiedAt: "2026-10",
				},
			},

			changes: {
				sep: {
					"1": {
						action: "update",
						previous: {
							title: "Main Skills",
							slotsAllow: 3,
							childAllow: true,
							treatChildAsSlot: true,
						},
					},
					"5": {
						action: "create",
						previous: null,
					},
				},
				aug: {
					"3": {
						action: "delete",
						index: 2,
						previous: {
							title: "Fitness",
							slotsAllow: 2,
							childAllow: false,
							treatChildAsSlot: false,
							modifiedAt: "2026-03",
						},
					},
				},
				jun: {
					"4": {
						action: "create",
						previous: null,
					},
				},
				mar: {
					"2": {
						action: "update",
						previous: {
							title: "Creative Activities",
							slotsAllow: 2,
							childAllow: false,
							treatChildAsSlot: false,
						},
					},
				},
				feb: {
					"3": {
						action: "update",
						previous: {
							title: "Fitness",
							slotsAllow: 1,
							childAllow: false,
							treatChildAsSlot: false,
							modifiedAt: "2026-01",
						},
					},
				},
				jan: {
					"1": {
						action: "update",
						previous: {
							title: "Main Skills",
							slotsAllow: 2,
							childAllow: true,
							treatChildAsSlot: true,
							modifiedAt: "2026-01",
						},
					},
				},
			},
		},

		2025: {
			latestMonth: "dec",
			order: ["1", "2", "3", "5"],

			latest: {
				"1": {
					title: "Main Skills",
					slotsAllow: 2,
					childAllow: true,
					treatChildAsSlot: true,
					modifiedAt: "2026-10",
				},
				"2": {
					title: "Creative Activities",
					slotsAllow: 2,
					childAllow: false,
					treatChildAsSlot: false,
					modifiedAt: "2026-04",
				},
				"3": {
					title: "Fitness",
					slotsAllow: 1,
					childAllow: false,
					treatChildAsSlot: false,
					modifiedAt: "2026-03",
				}
			},

			changes: {
				nov: {
					"1": {
						action: "update",
						previous: {
							title: "Main skill",
							slotsAllow: 2,
							childAllow: true,
							treatChildAsSlot: true,
						},
					},
				},
			},
		},
	},
};

// primary key = hobby-coding
// 2nd key = section id

// {
// 	2026: {
// 		1: {
// 			{hobbyid, start, end, sectionid}
// 		}
// 	}
// }

const ACTIVITY_INFO_NEW = {
	2026: {
		1: [
			{ id: "hobby-coding", sectionid: 1, slot: 0, start: null, end: null },
			{ id: "hobby-leetcode", sectionid: 1, slot: 1, start: null, end: null },
			{ id: "hobby-sketching", sectionid: 2, slot: 0, start: null, end: null },
			{ id: "hobby-guitar", sectionid: 2, slot: 1, start: null, end: null },
			{ id: "hobby-workout", sectionid: 3, slot: 0, start: null, end: null },
		],
		2: [
			{ id: "hobby-coding", sectionid: 1, slot: 0, start: null, end: null },
			{ id: "hobby-leetcode", sectionid: 1, slot: 1, start: null, end: null },
			{ id: "hobby-sketching", sectionid: 2, slot: 0, start: null, end: null },
			{ id: "hobby-guitar", sectionid: 2, slot: 1, start: null, end: null },
			{ id: "hobby-workout", sectionid: 3, slot: 0, start: null, end: null },
		],
		3: [
			{ id: "hobby-coding", sectionid: 1, slot: 0, start: null, end: null },
			{ id: "hobby-leetcode", sectionid: 1, slot: 1, start: null, end: null },
			{ id: "hobby-sketching", sectionid: 2, slot: 0, start: null, end: null },
			{ id: "hobby-chess", sectionid: 2, slot: 1, start: null, end: null },
			{ id: "hobby-workout", sectionid: 3, slot: 0, start: null, end: null },
		],
		4: [
			{ id: "hobby-coding", sectionid: 1, slot: 0, start: null, end: null },
			{ id: "hobby-leetcode", sectionid: 1, slot: 1, start: null, end: null },
			{ id: "hobby-sketching", sectionid: 2, slot: 0, start: null, end: null },
			{ id: "hobby-workout", sectionid: 3, slot: 0, start: null, end: null },
		],
		5: [
			{ id: "hobby-coding", sectionid: 1, slot: 0, start: null, end: null },
			{ id: "hobby-leetcode", sectionid: 1, slot: 1, start: null, end: null },
			{ id: "hobby-sketching", sectionid: 2, slot: 0, start: null, end: null },
			{ id: "hobby-guitar", sectionid: 2, slot: 1, start: null, end: null },
			{ id: "hobby-workout", sectionid: 3, slot: 0, start: null, end: null },
		],
		6: [
			{ id: "hobby-coding", sectionid: 1, slot: 0, start: null, end: null },
			{ id: "hobby-leetcode", sectionid: 1, slot: 1, start: null, end: null },
			{ id: "hobby-sketching", sectionid: 2, slot: 0, start: null, end: null },
			{ id: "hobby-guitar", sectionid: 2, slot: 1, start: null, end: null },
			{ id: "hobby-workout", sectionid: 3, slot: 0, start: null, end: null },
		],
		7: [
			{ id: "hobby-coding", sectionid: 1, slot: 0, start: null, end: null },
			{ id: "hobby-leetcode", sectionid: 1, slot: 1, start: null, end: null },
			{ id: "hobby-sketching", sectionid: 2, slot: 0, start: null, end: null },
			{ id: "hobby-guitar", sectionid: 2, slot: 1, start: null, end: null },
			{ id: "hobby-workout", sectionid: 3, slot: 0, start: null, end: null },
		],
		8: [
			{ id: "hobby-coding", sectionid: 1, slot: 0, start: null, end: null },
			{ id: "hobby-sketching", sectionid: 2, slot: 0, start: null, end: null },
			{ id: "hobby-chess", sectionid: 2, slot: 1, start: null, end: null },
			{ id: "hobby-guitar", sectionid: 4, slot: 0, start: null, end: null },
			{ id: "hobby-workout", sectionid: 3, slot: 0, start: null, end: null },
		],
		9: [
			{ id: "hobby-coding", sectionid: 1, slot: 0, start: null, end: null },
			{ id: "hobby-leetcode", sectionid: 1, slot: 1, start: null, end: null },
			{ id: "hobby-reading", sectionid: 5, slot: 0, start: null, end: null },
			{ id: "hobby-chess", sectionid: 2, slot: 1, start: null, end: null },
			{ id: "hobby-guitar", sectionid: 4, slot: 0, start: null, end: null },
			{ id: "hobby-workout", sectionid: 3, slot: 0, start: null, end: null },
		],
		10: [
			{ id: "hobby-coding", sectionid: 1, slot: 0, start: null, end: null },
			{ id: "hobby-leetcode", sectionid: 1, slot: 1, start: null, end: null },
			{ id: "hobby-reading", sectionid: 5, slot: 0, start: null, end: null },
			{ id: "hobby-chess", sectionid: 2, slot: 1, start: null, end: null },
			{ id: "hobby-guitar", sectionid: 4, slot: 0, start: null, end: null },
			{ id: "hobby-workout", sectionid: 3, slot: 0, start: null, end: null },
		],
		11: [
			{ id: "hobby-coding", sectionid: 1, slot: 0, start: null, end: null },
			{ id: "hobby-leetcode", sectionid: 1, slot: 1, start: null, end: null },
			{ id: "hobby-reading", sectionid: 5, slot: 0, start: null, end: null },
			{ id: "hobby-chess", sectionid: 2, slot: 1, start: null, end: null },
			{ id: "hobby-guitar", sectionid: 4, slot: 0, start: null, end: null },
			{ id: "hobby-workout", sectionid: 3, slot: 0, start: null, end: null },
		],
		9: [
			{ id: "hobby-coding", sectionid: 1, slot: 0, start: null, end: null },
			{ id: "hobby-leetcode", sectionid: 1, slot: 1, start: null, end: null },
			{ id: "hobby-reading", sectionid: 5, slot: 0, start: null, end: null },
			{ id: "hobby-chess", sectionid: 2, slot: 1, start: null, end: null },
			{ id: "hobby-guitar", sectionid: 4, slot: 0, start: null, end: null },
			{ id: "hobby-workout", sectionid: 3, slot: 0, start: null, end: null },
		]
	}
}

export const ACTIVITY_INFO = {
	'section-skills-slot-0': [
		{
			id: 'period-001',
			hobbyId: 'hobby-coding',
			start: '2026-01-01',
			end: null,
		},
	],

	'section-skills-slot-1': [
		{
			id: 'period-002',
			hobbyId: 'hobby-leetcode',
			start: '2026-01-05',
			end: '2026-04-30',
		},
		{
			id: 'period-003',
			hobbyId: 'hobby-reading',
			start: '2026-05-01',
			end: null,
		},
	],

	'section-activities-slot-0': [
		{
			id: 'period-004',
			hobbyId: 'hobby-chess',
			start: '2026-01-10',
			end: '2026-06-30',
		},
	],

	'section-activities-slot-1': [
		{
			id: 'period-005',
			hobbyId: 'hobby-sketching',
			start: '2026-03-01',
			end: null,
		},
	],

	'section-fitness-slot-0': [
		{
			id: 'period-006',
			hobbyId: 'hobby-workout',
			start: '2026-03-05',
			end: null,
		},
	],
};


export const ACTIVITY_LOGS = {
	'hobby-coding': {
		'2026-01': [
			60, 0, 90, 45, 120, 0, 30, 60, 0, 75, 90, 40, 0, 60, 120, 30, 45, 0, 90, 60, 30, 75, 0,
			45, 90, 120, 0, 60, 30, 90, 45,
		],

		'2026-02': [
			45, 60, 0, 90, 30, 120, 45, 0, 60, 90, 30, 45, 75, 0, 60, 120, 30, 90, 0, 45, 60, 30,
			90, 0, 120, 45, 60, 0,
		],

		'2026-03': [
			90, 60, 45, 0, 120, 30, 60, 90, 0, 45, 75, 60, 30, 120, 0, 45, 90, 60, 30, 0, 120, 45,
			60, 90, 30, 0, 75, 60, 45, 90, 30,
		],

		'2026-10': [
			0, 60, 90, 0, 45, 120, 30, 0, 60, 90, 45, 0, 120, 60, 30, 90, 0, 45, 60, 60, 90, 0, 45,
			30, 0,
		],
	},

	'hobby-leetcode': {
		'2026-01': [
			2, 0, 3, 1, 5, 0, 2, 4, 0, 3, 2, 1, 0, 4, 6, 2, 0, 3, 1, 5, 0, 2, 4, 1, 0, 3, 2, 0, 5,
			1, 3,
		],

		'2026-04': [
			2, 4, 0, 3, 1, 0, 5, 2, 4, 0, 3, 1, 2, 0, 4, 5, 0, 2, 3, 1, 0, 4, 2, 3, 0, 1, 5, 2, 0,
			3,
		],
	},

	'hobby-reading': {
		'2026-05': [
			10, 20, 0, 15, 30, 0, 25, 10, 0, 20, 15, 30, 0, 10, 25, 20, 0, 15, 30, 10, 0, 20, 15,
			25, 0, 10, 30, 20, 0, 15, 25,
		],
	}
}