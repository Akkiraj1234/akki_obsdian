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

				"6": {
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
					"6": {
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


const ACTIVITY_INFO = {
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


const ACTIVITY_LOGS = {
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


const MONTHS = [
	"jan", "feb", "mar", "apr", "may", "jun",
	"jul", "aug", "sep", "oct", "nov", "dec",
];

export class HobbyPlanner {
	constructor() {
		this.planner = HONNY_PLANNER;
	}

	/**
	 * Get the latest snapshot or reconstruct a historical month.
	 *
	 * get("curr")       -> latest year and latest month
	 * get(2026)          -> latest snapshot for 2026
	 * get(2026, "oct")   -> October 2026
	 * get(2026, "sep")   -> September 2026
	 */
	get(yearOrCurrent, month) {
		const year = this.#normalizeYear(yearOrCurrent);

		if (!Number.isInteger(year) || !Object.hasOwn(this.planner.data, year)) {
			return null;
		}

		const yearData = this.planner.data[year];
		const targetMonth = this.#normalizeMonth(month, yearData.latestMonth);

		if (!targetMonth) {
			return null;
		}

		const targetIndex = MONTHS.indexOf(targetMonth);
		const latestIndex = MONTHS.indexOf(yearData.latestMonth);

		// Validate the target and snapshot months.
		if (
			targetIndex === -1 ||
			latestIndex === -1 ||
			targetIndex > latestIndex
		) {
			return null;
		}

		// Copy the snapshot; never mutate the original data.
		const sections = structuredClone(yearData.latest);
		const order = yearData.order.filter(
			(id) => Object.hasOwn(sections, id)
		);

		// Reverse each month's changes to reach the target.
		for (
			let index = latestIndex - 1;
			index >= targetIndex;
			index--
		) {
			const changes = yearData.changes[MONTHS[index]];
			filterfilterfilter
			if (changes) {
				this.#reverseChanges(changes, sections, order);
			}
		}

		return {
			title: this.planner.title,
			description: this.planner.description,
			year,
			month: targetMonth,
			order,
			latest: sections,
		};
	}

	#normalizeYear(yearOrCurrent) {
		if (
			typeof yearOrCurrent === "string" &&
			yearOrCurrent.toLowerCase() === "curr"
		) {
			// Resolve to the current year rather then max yearin planner
			// reason bcz we could create future year plan
			return new Date().getFullYear();
		}

		if (typeof yearOrCurrent === "number") {
			return Number(yearOrCurrent);
		}

		return NaN;
	}

	#normalizeMonth(month, latestMonth) {
		// If no month is supplied, use the year's latest snapshot.
		if (month == null || typeof month === "string" || month === "curr") {
			return latestMonth;
		}

		if (typeof month !== "string") {
			return null;
		}

		const normalized = month.trim().toLowerCase().slice(0, 3);
		return MONTHS.includes(normalized) ? normalized : null;
	}

	#reverseChanges(changes, sections, order) {
		for (const [id, change] of Object.entries(changes)) {
			switch (change.action) {
				case "update": {
					if (
						Object.hasOwn(sections, id) &&
						change.previous
					) {
						sections[id] = {
							...sections[id],
							...structuredClone(change.previous),
						};
					}

					break;
				}

				case "create": {
					// Undo the creation by removing this section.
					delete sections[id];

					const index = order.indexOf(id);

					if (index !== -1) {
						order.splice(index, 1);
					}

					break;
				}

				case "delete": {
					// Undo the deletion by restoring the section.
					if (!change.previous) {
						break;
					}

					sections[id] = structuredClone(change.previous);

					// Avoid duplicate IDs in the display order.
					const existingIndex = order.indexOf(id);

					if (existingIndex !== -1) {
						order.splice(existingIndex, 1);
					}

					const index = Math.max(
						0,
						Math.min(change.index ?? order.length, order.length)
					);

					order.splice(index, 0, id);

					break;
				}

				default:
					throw new Error(
						`Unknown planner action "${change.action}" for section ${id}`
					);
			}
		}
	}
}
