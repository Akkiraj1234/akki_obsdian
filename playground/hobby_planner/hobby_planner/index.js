import {
	SHORT_MONTHS,
	HobbyManager,
	ActivityManager,
	ActivityHeatmapManager,
	HobbyPlannerManager,
	getSectionIdFilterByPlanner
} from "../dataFacther.js";

const hobbyManager = new HobbyManager();
const activityManager = new ActivityManager();
const activityHeatmapManager = new ActivityHeatmapManager();
const hobbyPlannerManager = new HobbyPlannerManager();
const MONTH_WIDTH = 100;



/**
 * HobbyPlanner
 *
 * Manages the Hobby Planner interface and its rendering lifecycle.
 *
 * Responsible for:
 * - Creating the base HTML layout.
 * - Caching references to required DOM elements.
 * - Preparing hobby planner and activity data.
 * - Rendering the planner for a selected month and year.
 * - Managing user interactions and timeline navigation.
 *
 * The class receives a container element and builds the planner
 * interface inside it during initialization.
 *
 * @class HobbyPlanner
 */
class HobbyPlanner {

	/**
	 * Creates a HobbyPlanner instance.
	 *
	 * Initializes the instance state and stores the container
	 * element in which the planner interface will be rendered.
	 *
	 * @param {HTMLElement} element
	 *        Container element for the Hobby Planner interface.
	 *
	 * @throws {Error}
	 *         If no valid container element is provided.
	 */
	constructor(element) {
		if (!element) {
			throw new Error("HobbyPlanner requires a valid HTML element");
		}

		this.time = new Date()
		this.element = element;
		this.selectedIndex = 0;
		this.monthData = [];
		this.plannerData = {};

		this.wheelTimer = null;
		this.wheelDirection = 0;
	}

	/**
	 * Initializes the Hobby Planner interface.
	 *
	 * Creates the base HTML layout and caches references to
	 * the DOM elements required by the rendering methods.
	 *
	 * Must be called before rendering the planner.
	 */
	initialize() {
		this.element.innerHTML = `
		<main class="tracker">
			<section class="labels" aria-label="Hobby planner labels">
				<p class="lable-heading"></p>
				<div class="label-list"></div>
			</section>

			<section class="timeline-viewport" aria-label="Hobby planner timeline">
				<div class="timeline">
					<div class="timeline-track">
						<div class="timeline-months-row"></div>
						<div class="timeline-data">
							<div class="timeline-grid" aria-hidden="true"></div>
						</div>
					</div>
				</div>
			</section>
		</main>`;

		this.heading = this.element.querySelector(".lable-heading");
		this.labelList = this.element.querySelector(".label-list");
		this.timeline = this.element.querySelector(".timeline");
		this.track = this.element.querySelector(".timeline-track");
		this.monthRow = this.element.querySelector(".timeline-months-row");
		this.timelineData = this.element.querySelector(".timeline-data");
		this.timelineGrid = this.element.querySelector(".timeline-grid");
	}

	destroy() {
		this.element = null;
		this.selectedIndex = 0;
		this.monthData = [];
		this.plannerData = {};

		clearTimeout(this.wheelTimer);
		window.removeEventListener("resize", this.resizeHandler);
		this.element.replaceChildren();
	}

	/**
	 * Renders the Hobby Planner for the requested month and year.
	 *
	 * Uses the current month and year when arguments are omitted.
	 * Validates the requested date, prepares the required data,
	 * renders the interface, and binds user interaction events.
	 *
	 * @param {number|null} [month=null]
	 *        Requested month (0–11, where 0 represents January).
	 *
	 * @param {number|null} [year=null]
	 *        Requested year (e.g. 2026).
	 *
	 * @throws {RangeError}
	 *         If the requested month or year is invalid.
	 */
	render(year = null, month = null) {
		year ??= this.time.getFullYear();
		month ??= this.time.getMonth();

		this.emptyHtmlElements();
		this.#validateDate(year, month);
		this.#prepareHobbyData(year, month);
		this.#renderLeftLable();
		this.#renderRightMonth();
		this.#renderRightActivity();
	}

	emptyHtmlElements() {
		this.monthRow.replaceChildren();
		this.labelList.replaceChildren();
		this.timelineData.replaceChildren(this.timelineGrid);
		this.timelineGrid.replaceChildren();
	}

	/**
	* Validates the requested month and year.
	*
	* @param {number} month
	*        Month index (0–11).
	*
	* @param {number} year
	*        Positive integer representing the year.
	*
	* @throws {RangeError}
	*         If the month or year is outside the allowed range.
	*/
	#validateDate(year, month) {
		if (!Number.isInteger(month) || month < 0 || month > 11) {
			throw new RangeError("Month must be an integer between 0 and 11.");
		}

		if (!Number.isInteger(year) || year < 1) {
			throw new RangeError("Year must be a valid positive integer.");
		}
	}

	/*
	prepare hobby data work is to prepare the hobby data so other part of rende can use
	these data to render the site its prepare
	1. monthdata : an array of arrya containing activity data for 12 months previous year and curr year data
	2. selcted index: tels about the current selcted index
	3. hobblyplanneddata: its contian selcted month hobbly planned layout that we are gonna use
	*/
	#prepareHobbyData(year, month) {
		const plannerData = hobbyPlannerManager.get(year, month);
		const filterobj = getSectionIdFilterByPlanner(plannerData);

		const currentYearData = activityManager.get_by_month(
			year, 0, month, filterobj, { throwOnEmpty: false }
		);

		const previousYearData = activityManager.get_by_month(
			year - 1, month + 1, 11, filterobj, { throwOnEmpty: false }
		);

		const currentYearMonths = Array.from(
			{ length: month + 1 },
			(_, index) => index
		).reverse();

		const previousYearMonths = Array.from(
			{ length: 11 - month },
			(_, index) => 11 - index
		);

		const convertToList = (data, months) =>
			months.map(monthIndex => data[monthIndex] ?? []);

		this.plannerData = plannerData;
		this.selectedIndex = 0;
		this.monthData = [
			convertToList(currentYearData, currentYearMonths),
			convertToList(previousYearData, previousYearMonths)
		];
	}
	#renderLeftLable() { }
	#renderRightMonth() { }
	#renderRightActivity() { }
}


// main body runner

function main() {
	const mainbody = document.querySelector(".mainbody");
	const planner = new HobbyPlanner(mainbody);
	planner.initialize();
	planner.render();
}
main();