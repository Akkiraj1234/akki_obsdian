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

export const FAKE_HOBBIES = {
	'hobby-coding': {
		name: 'Coding',
		createdAt: '2026-01-01T09:00:00',
		updatedAt: '2026-10-20T12:00:00',
		parentId: null,
		description: 'Building software and learning programming',
		unit_name: "boolean",
		unit_type: "boolean",
		target: 1,
		color: '#6366F1',
	},

	'hobby-leetcode': {
		name: 'LeetCode',
		createdAt: '2026-01-05T10:00:00',
		updatedAt: '2026-10-10T16:00:00',
		parentId: 'hobby-coding',
		description: 'Practicing algorithms and data structures',
		unit_name: "problems",
		unit_type: "count",
		target: 2,
		color: '#F59E0B',
	},

	'hobby-reading': {
		name: 'Book Reading',
		createdAt: '2026-02-01T10:00:00',
		updatedAt: '2026-10-01T10:00:00',
		parentId: null,
		description: 'Reading technical and personal development books',
		unit_name: "pages",
		unit_type: "count",
		target: 10,
		color: '#10B981',
	},

	'hobby-chess': {
		name: 'Chess',
		createdAt: '2026-01-10T12:00:00',
		updatedAt: '2026-06-15T12:00:00',
		parentId: null,
		description: 'Chess puzzles, tactics, and practice games',
		unit_name: "minutes",
		unit_type: "duration",
		target: 30,
		color: '#8B5CF6',
	},

	'hobby-sketching': {
		name: 'Sketching',
		createdAt: '2026-03-01T12:00:00',
		updatedAt: '2026-10-05T12:00:00',
		parentId: null,
		description: 'Drawing and improving artistic skills',
		unit_name: "minutes",
		unit_type: "duration",
		target: 120,
		color: '#EC4899',
	},

	'hobby-workout': {
		name: 'Home Workout',
		createdAt: '2026-03-05T07:00:00',
		updatedAt: '2026-10-22T07:00:00',
		parentId: null,
		description: 'Strength training and mobility',
		unit_name: "minutes",
		unit_type: "duration",
		target: 30,
		color: '#EF4444',
	},

	'hobby-guitar': {
		name: 'Guitar Practice',
		createdAt: '2026-04-01T18:00:00',
		updatedAt: '2026-10-12T18:00:00',
		parentId: null,
		description: 'Practicing chords, technique, and songs',
		unit_name: "minutes",
		unit_type: "duration",
		target: 60,
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
			latestMonth: 10,
			order: ["1", "2", "4", "5"],

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
				9: {
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
				8: {
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
				6: {
					"4": {
						action: "create",
						previous: null,
					},
				},
				3: {
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
				2: {
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
				1: {
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
			latestMonth: 12,
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
				11: {
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
		12: [
			{ id: "hobby-coding", sectionid: 1, slot: 0, start: null, end: null },
			{ id: "hobby-leetcode", sectionid: 1, slot: 1, start: null, end: null },
			{ id: "hobby-reading", sectionid: 5, slot: 0, start: null, end: null },
			{ id: "hobby-chess", sectionid: 2, slot: 1, start: null, end: null },
			{ id: "hobby-guitar", sectionid: 4, slot: 0, start: null, end: null },
			{ id: "hobby-workout", sectionid: 3, slot: 0, start: null, end: null },
		]
	}
}

/**
 * Daily hobby activity heatmap data.
 *
 * values[index] represents activity on day index + 1.
 * targetHistory entries take effect from their `from` day.
 * A target remains active until the next entry and carries
 * forward into later months.
 *
 * Target changes are illustrative fake-data events.
 */
export const ACTIVITY_HEATMAP_DATA = {
	2026: {
		1: {
			"hobby-coding": {
				values: [1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1],
				targetHistory: [{ from: 1, target: 1 }]
			},
			"hobby-leetcode": {
				values: [2, 0, 3, 1, 5, 0, 2, 4, 0, 3, 2, 1, 0, 4, 6, 2, 0, 3, 1, 5, 0, 2, 4, 1, 0, 3, 2, 0, 5, 1, 3],
				targetHistory: [{ from: 1, target: 2 }]
			},
			"hobby-sketching": {
				values: [30, 45, 0, 60, 20, 0, 40, 75, 30, 0, 50, 60, 0, 25, 45, 90, 0, 30, 60, 20, 0, 45, 75, 30, 0, 60, 40, 0, 25, 50, 60],
				targetHistory: [{ from: 1, target: 120 }]
			},
			"hobby-guitar": {
				values: [20, 30, 0, 45, 60, 0, 30, 15, 40, 0, 60, 30, 20, 0, 45, 75, 0, 30, 60, 15, 0, 45, 30, 60, 0, 20, 45, 0, 30, 60, 40],
				targetHistory: [{ from: 1, target: 60 }]
			},
			"hobby-workout": {
				values: [30, 0, 45, 30, 0, 60, 45, 0, 30, 60, 0, 45, 30, 0, 60, 45, 30, 0, 45, 60, 0, 30, 45, 0, 60, 30, 0, 45, 60, 30, 0],
				targetHistory: [{ from: 1, target: 30 }]
			}
		},

		2: { // February
			"hobby-coding": {
				values: [1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0],
				targetHistory: [{ from: 1, target: 1 }]
			},
			"hobby-leetcode": {
				values: [3, 1, 0, 4, 2, 5, 0, 3, 1, 6, 2, 0, 4, 3, 1, 0, 5, 2, 4, 0, 3, 1, 5, 2, 0, 4, 1, 3],
				targetHistory: [{ from: 1, target: 2 }]
			},
			"hobby-sketching": {
				values: [45, 0, 30, 60, 20, 45, 0, 75, 30, 0, 60, 40, 25, 0, 50, 30, 60, 0, 45, 20, 0, 75, 30, 45, 0, 60, 25, 40],
				targetHistory: [{ from: 1, target: 120 }]
			},
			"hobby-guitar": {
				values: [30, 0, 45, 20, 60, 0, 30, 45, 0, 60, 15, 30, 0, 45, 60, 0, 20, 40, 0, 30, 60, 45, 0, 30, 15, 0, 45, 60],
				targetHistory: [{ from: 1, target: 60 }]
			},
			"hobby-workout": {
				values: [45, 0, 30, 60, 0, 45, 30, 0, 60, 45, 0, 30, 45, 60, 0, 30, 45, 0, 60, 30, 45, 0, 30, 60, 0, 45, 30, 60],
				targetHistory: [{ from: 1, target: 30 }]
			}
		},

		3: { // March
			"hobby-coding": {
				values: [1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
				targetHistory: [{ from: 1, target: 1 }]
			},
			"hobby-leetcode": {
				values: [4, 2, 0, 3, 5, 1, 0, 6, 2, 4, 0, 3, 1, 5, 2, 0, 4, 6, 1, 3, 0, 5, 2, 4, 1, 0, 3, 6, 2, 4, 0],
				targetHistory: [
					{ from: 1, target: 2 },
					{ from: 15, target: 3 }
				]
			},
			"hobby-sketching": {
				values: [30, 60, 0, 45, 75, 20, 0, 40, 60, 30, 0, 90, 45, 0, 25, 60, 30, 45, 0, 75, 20, 0, 60, 40, 30, 0, 45, 90, 0, 60, 30],
				targetHistory: [{ from: 1, target: 120 }]
			},
			"hobby-chess": {
				values: [0, 20, 30, 0, 45, 15, 0, 30, 60, 0, 20, 45, 0, 30, 15, 60, 0, 25, 40, 0, 30, 45, 0, 20, 60, 0, 30, 15, 45, 0, 30],
				targetHistory: [{ from: 1, target: 30 }]
			},
			"hobby-workout": {
				values: [30, 45, 0, 60, 30, 0, 45, 60, 0, 30, 45, 0, 60, 30, 45, 0, 30, 60, 0, 45, 30, 0, 60, 45, 30, 0, 45, 60, 0, 30, 45],
				targetHistory: [{ from: 1, target: 30 }]
			}
		},

		4: { // April
			"hobby-coding": {
				values: [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1],
				targetHistory: [{ from: 1, target: 1 }]
			},
			"hobby-leetcode": {
				values: [2, 4, 0, 3, 1, 5, 2, 0, 4, 3, 1, 0, 5, 2, 4, 0, 3, 1, 6, 0, 2, 4, 3, 0, 5, 1, 2, 0, 4, 3],
				targetHistory: [{ from: 1, target: 2 }]
			},
			"hobby-sketching": {
				values: [45, 0, 30, 60, 0, 25, 45, 0, 75, 30, 60, 0, 40, 20, 0, 60, 45, 30, 0, 75, 25, 0, 45, 60, 30, 0, 50, 40, 0, 60],
				targetHistory: [
					{ from: 1, target: 120 },
					{ from: 10, target: 150 }
				]
			},
			"hobby-workout": {
				values: [30, 45, 0, 60, 0, 30, 45, 60, 0, 30, 45, 0, 60, 30, 0, 45, 60, 30, 0, 45, 30, 60, 0, 45, 30, 0, 60, 45, 30, 0],
				targetHistory: [{ from: 1, target: 30 }]
			}
		},

		5: { // May
			"hobby-coding": {
				values: [1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1],
				targetHistory: [{ from: 1, target: 1 }]
			},
			"hobby-leetcode": {
				values: [3, 0, 4, 2, 1, 5, 0, 3, 2, 6, 0, 4, 1, 3, 0, 5, 2, 4, 0, 3, 1, 6, 2, 0, 4, 3, 0, 5, 1, 2, 4],
				targetHistory: [{ from: 1, target: 2 }]
			},
			"hobby-sketching": {
				values: [30, 45, 0, 60, 20, 0, 75, 30, 45, 0, 60, 25, 0, 40, 60, 30, 0, 45, 75, 0, 20, 60, 30, 0, 45, 50, 0, 30, 60, 25, 45],
				targetHistory: [
					{ from: 1, target: 150 }
				]
			},
			"hobby-guitar": {
				values: [20, 0, 30, 45, 60, 0, 15, 30, 0, 45, 60, 20, 0, 30, 45, 0, 60, 30, 15, 0, 45, 60, 30, 0, 20, 45, 0, 60, 30, 15, 45],
				targetHistory: [{ from: 1, target: 60 }]
			},
			"hobby-workout": {
				values: [45, 0, 30, 60, 45, 0, 30, 45, 60, 0, 30, 45, 0, 60, 30, 45, 0, 30, 60, 45, 0, 30, 45, 60, 0, 30, 45, 0, 60, 30, 45],
				targetHistory: [{ from: 1, target: 30 }]
			}
		},

		6: { // June
			"hobby-coding": {
				values: [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
				targetHistory: [{ from: 1, target: 1 }]
			},
			"hobby-leetcode": {
				values: [2, 3, 0, 5, 1, 4, 0, 2, 6, 3, 0, 4, 1, 5, 0, 3, 2, 4, 0, 6, 1, 3, 0, 5, 2, 4, 0, 1, 3, 5],
				targetHistory: [{ from: 1, target: 2 }]
			},
			"hobby-sketching": {
				values: [45, 0, 30, 60, 25, 0, 45, 75, 30, 0, 60, 40, 0, 20, 50, 30, 0, 45, 60, 0, 25, 75, 30, 45, 0, 60, 40, 0, 30, 50],
				targetHistory: [{ from: 1, target: 150 }]
			},
			"hobby-guitar": {
				values: [30, 45, 0, 20, 60, 0, 30, 45, 15, 0, 60, 30, 0, 45, 20, 60, 0, 30, 45, 0, 15, 60, 30, 0, 45, 20, 0, 60, 30, 45],
				targetHistory: [{ from: 1, target: 60 }]
			},
			"hobby-workout": {
				values: [30, 0, 45, 60, 0, 30, 45, 0, 60, 30, 45, 0, 30, 60, 0, 45, 30, 0, 60, 45, 30, 0, 45, 60, 0, 30, 45, 0, 60, 30],
				targetHistory: [
					{ from: 1, target: 30 },
					{ from: 15, target: 45 }
				]
			}
		},

		7: { // July
			"hobby-coding": {
				values: [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1],
				targetHistory: [{ from: 1, target: 1 }]
			},
			"hobby-leetcode": {
				values: [4, 2, 0, 5, 3, 1, 0, 4, 6, 2, 0, 3, 5, 1, 0, 4, 2, 6, 0, 3, 1, 5, 0, 4, 2, 3, 0, 6, 1, 4, 2],
				targetHistory: [
					{ from: 1, target: 3 }
				]
			},
			"hobby-sketching": {
				values: [30, 60, 0, 45, 20, 75, 0, 30, 60, 0, 45, 25, 0, 50, 30, 60, 0, 45, 75, 0, 20, 60, 30, 0, 45, 50, 0, 30, 60, 25, 45],
				targetHistory: [{ from: 1, target: 150 }]
			},
			"hobby-guitar": {
				values: [20, 45, 0, 30, 60, 0, 15, 45, 30, 0, 60, 20, 0, 45, 30, 60, 0, 15, 45, 0, 30, 60, 20, 0, 45, 30, 0, 60, 15, 45, 30],
				targetHistory: [
					{ from: 1, target: 60 },
					{ from: 12, target: 90 }
				]
			},
			"hobby-workout": {
				values: [45, 0, 30, 60, 0, 45, 30, 0, 60, 45, 0, 30, 60, 45, 0, 30, 45, 0, 60, 30, 45, 0, 30, 60, 0, 45, 30, 60, 0, 45, 30],
				targetHistory: [{ from: 1, target: 45 }]
			}
		},

		8: { // August
			"hobby-coding": {
				values: [1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1],
				targetHistory: [{ from: 1, target: 1 }]
			},
			"hobby-sketching": {
				values: [30, 0, 45, 60, 20, 0, 75, 30, 0, 45, 60, 25, 0, 40, 60, 30, 0, 45, 75, 0, 20, 60, 30, 0, 45, 50, 0, 30, 60, 25, 45],
				targetHistory: [
					{ from: 1, target: 150 },
					{ from: 18, target: 90 }
				]
			},
			"hobby-chess": {
				values: [0, 30, 45, 0, 20, 60, 15, 0, 30, 45, 0, 20, 60, 0, 30, 15, 45, 0, 60, 20, 0, 30, 45, 0, 15, 60, 30, 0, 45, 20, 0],
				targetHistory: [{ from: 1, target: 30 }]
			},
			"hobby-guitar": {
				values: [30, 0, 45, 20, 60, 0, 30, 15, 45, 0, 60, 30, 20, 0, 45, 60, 0, 30, 15, 45, 0, 60, 20, 0, 30, 45, 0, 60, 15, 30, 45],
				targetHistory: [{ from: 1, target: 90 }]
			},
			"hobby-workout": {
				values: [30, 45, 0, 60, 30, 0, 45, 60, 0, 30, 45, 0, 60, 30, 45, 0, 30, 60, 0, 45, 30, 0, 60, 45, 30, 0, 45, 60, 0, 30, 45],
				targetHistory: [{ from: 1, target: 45 }]
			}
		},

		9: { // September
			"hobby-coding": {
				values: [1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1],
				targetHistory: [{ from: 1, target: 1 }]
			},
			"hobby-leetcode": {
				values: [3, 0, 4, 2, 5, 1, 0, 3, 6, 2, 0, 4, 1, 5, 0, 3, 2, 4, 0, 6, 1, 3, 0, 5, 2, 4, 0, 1, 3, 5],
				targetHistory: [{ from: 1, target: 3 }]
			},
			"hobby-reading": {
				values: [10, 20, 0, 15, 30, 0, 25, 10, 0, 20, 15, 30, 0, 10, 25, 20, 0, 15, 30, 10, 0, 20, 15, 25, 0, 10, 30, 20, 0, 15],
				targetHistory: [{ from: 1, target: 10 }]
			},
			"hobby-chess": {
				values: [0, 20, 30, 0, 45, 15, 0, 30, 60, 0, 20, 45, 0, 30, 15, 60, 0, 25, 40, 0, 30, 45, 0, 20, 60, 0, 30, 15, 45, 0],
				targetHistory: [
					{ from: 1, target: 30 },
					{ from: 16, target: 45 }
				]
			},
			"hobby-guitar": {
				values: [20, 45, 0, 30, 60, 0, 15, 45, 30, 0, 60, 20, 0, 45, 30, 60, 0, 15, 45, 0, 30, 60, 20, 0, 45, 30, 0, 60, 15, 45],
				targetHistory: [{ from: 1, target: 90 }]
			},
			"hobby-workout": {
				values: [45, 0, 30, 60, 0, 45, 30, 0, 60, 45, 0, 30, 60, 45, 0, 30, 45, 0, 60, 30, 45, 0, 30, 60, 0, 45, 30, 60, 0, 45],
				targetHistory: [{ from: 1, target: 45 }]
			}
		},

		10: { // October
			"hobby-coding": {
				values: [0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1],
				targetHistory: [{ from: 1, target: 1 }]
			},
			"hobby-leetcode": {
				values: [4, 2, 0, 5, 3, 1, 0, 4, 6, 2, 0, 3, 5, 1, 0, 4, 2, 6, 0, 3, 1, 5, 0, 4, 2, 3, 0, 6, 1, 4, 2],
				targetHistory: [{ from: 1, target: 3 }]
			},
			"hobby-reading": {
				values: [10, 20, 0, 15, 30, 0, 25, 10, 0, 20, 15, 30, 0, 10, 25, 20, 0, 15, 30, 10, 0, 20, 15, 25, 0, 10, 30, 20, 0, 15, 25],
				targetHistory: [
					{ from: 1, target: 10 },
					{ from: 12, target: 15 }
				]
			},
			"hobby-chess": {
				values: [0, 30, 45, 0, 20, 60, 15, 0, 30, 45, 0, 20, 60, 0, 30, 15, 45, 0, 60, 20, 0, 30, 45, 0, 15, 60, 30, 0, 45, 20, 0],
				targetHistory: [{ from: 1, target: 45 }]
			},
			"hobby-guitar": {
				values: [30, 0, 45, 20, 60, 0, 30, 15, 45, 0, 60, 30, 20, 0, 45, 60, 0, 30, 15, 45, 0, 60, 20, 0, 30, 45, 0, 60, 15, 30, 45],
				targetHistory: [{ from: 1, target: 90 }]
			},
			"hobby-workout": {
				values: [30, 45, 0, 60, 30, 0, 45, 60, 0, 30, 45, 0, 60, 30, 45, 0, 30, 60, 0, 45, 30, 0, 60, 45, 30, 0, 45, 60, 0, 30, 45],
				targetHistory: [
					{ from: 1, target: 45 },
					{ from: 22, target: 60 }
				]
			}
		},

		11: { // November
			"hobby-coding": {
				values: [1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1],
				targetHistory: [{ from: 1, target: 1 }]
			},
			"hobby-leetcode": {
				values: [3, 0, 4, 2, 1, 5, 0, 3, 2, 6, 0, 4, 1, 3, 0, 5, 2, 4, 0, 3, 1, 6, 2, 0, 4, 3, 0, 5, 1, 2],
				targetHistory: [{ from: 1, target: 3 }]
			},
			"hobby-reading": {
				values: [10, 0, 20, 15, 30, 0, 25, 10, 20, 0, 15, 30, 10, 0, 25, 20, 15, 0, 30, 10, 20, 0, 15, 25, 30, 0, 10, 20, 15, 0],
				targetHistory: [{ from: 1, target: 15 }]
			},
			"hobby-chess": {
				values: [0, 20, 30, 45, 0, 15, 60, 0, 30, 20, 0, 45, 30, 0, 15, 60, 20, 0, 45, 30, 0, 60, 15, 30, 0, 20, 45, 0, 30, 60],
				targetHistory: [{ from: 1, target: 45 }]
			},
			"hobby-guitar": {
				values: [20, 45, 0, 30, 60, 0, 15, 45, 30, 0, 60, 20, 0, 45, 30, 60, 0, 15, 45, 0, 30, 60, 20, 0, 45, 30, 0, 60, 15, 45],
				targetHistory: [
					{ from: 1, target: 90 },
					{ from: 16, target: 45 }
				]
			},
			"hobby-workout": {
				values: [45, 0, 30, 60, 0, 45, 30, 0, 60, 45, 0, 30, 60, 45, 0, 30, 45, 0, 60, 30, 45, 0, 30, 60, 0, 45, 30, 60, 0, 45],
				targetHistory: [{ from: 1, target: 60 }]
			}
		},

		12: { // December
			"hobby-coding": {
				values: [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1],
				targetHistory: [{ from: 1, target: 1 }]
			},
			"hobby-leetcode": {
				values: [2, 3, 0, 5, 1, 4, 0, 2, 6, 3, 0, 4, 1, 5, 0, 3, 2, 4, 0, 6, 1, 3, 0, 5, 2, 4, 0, 1, 3, 5, 2],
				targetHistory: [{ from: 1, target: 3 }]
			},
			"hobby-reading": {
				values: [10, 20, 0, 15, 30, 0, 25, 10, 0, 20, 15, 30, 0, 10, 25, 20, 0, 15, 30, 10, 0, 20, 15, 25, 0, 10, 30, 20, 0, 15, 25],
				targetHistory: [
					{ from: 1, target: 15 },
					{ from: 20, target: 12 }
				]
			},
			"hobby-chess": {
				values: [0, 30, 45, 0, 20, 60, 15, 0, 30, 45, 0, 20, 60, 0, 30, 15, 45, 0, 60, 20, 0, 30, 45, 0, 15, 60, 30, 0, 45, 20, 0],
				targetHistory: [
					{ from: 1, target: 45 },
					{ from: 10, target: 60 }
				]
			},
			"hobby-guitar": {
				values: [30, 0, 45, 20, 60, 0, 30, 15, 45, 0, 60, 30, 20, 0, 45, 60, 0, 30, 15, 45, 0, 60, 20, 0, 30, 45, 0, 60, 15, 30, 45],
				targetHistory: [{ from: 1, target: 45 }]
			},
			"hobby-workout": {
				values: [30, 45, 0, 60, 30, 0, 45, 60, 0, 30, 45, 0, 60, 30, 45, 0, 30, 60, 0, 45, 30, 0, 60, 45, 30, 0, 45, 60, 0, 30, 45],
				targetHistory: [{ from: 1, target: 60 }]
			}
		}
	}
};