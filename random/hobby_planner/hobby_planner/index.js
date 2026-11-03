import {
	SHORT_MONTHS,
	HobbyManager,
	ActivityManager,
	ActivityHeatmapManager,
	HobbyPlannerManager,
	buildFilterObjectFromPlanner
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
		this.monthdata = [];

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
	render(month = null, year = null) {
		month ??= this.time.getMonth();
		year ??= this.time.getFullYear();

		this.#validateDate(month, year);
		this.#prepareHobbyData(month, year);
		this.bindEvents();
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
	#validateDate(month, year) {
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
	#prepareHobbyData(month, year) {
		const plannerData = hobbyPlannerManager.get(month, year);
		const filterobj = buildFilterObjectFromPlanner(plannerData);
		const currentActivityData = activityManager.get_by_month(year, 0, month, filterobj);
		const previousActivityData = activityManager.get_by_month(year - 1, month + 1, 11, filterobj);

		const currentYearMonths = Array.from(
			{ length: latestMonth + 1 },
			(_, index) => index
		).reverse();

		const previousYearMonths = Array.from(
			{ length: 11 - latestMonth },
			(_, index) => 11 - index
		);

		const monthPositions = [
			...currentYearMonths.map(month => ({
				year: latestYear,
				month
			})),
			...previousYearMonths.map(month => ({
				year: latestYear - 1,
				month
			}))
		];

		this.monthdata = monthPositions.map(({ year, month }) => {
			try {
				const result = hobbyPlannerManager.get_with_activity(
					month,
					year
				);

				return {
					year,
					month,
					planner: result,
					available: true
				};
			} catch {
				return {
					year,
					month,
					planner: null,
					available: false
				};
			}
		});
	}

	emptyHtmlElements() {
		this.monthRow.replaceChildren();
		this.labelList.replaceChildren();

		this.timelineData.replaceChildren(this.timelineGrid);
		this.timelineGrid.replaceChildren();
	}

	// ----------------------------------
	// MAIN RENDER
	// ----------------------------------

	render() {
		this.emptyHtmlElements();

		this.renderMonths();
		this.renderPlanner();
		this.renderActivityBars();
		this.updateLayout();
	}

	// ----------------------------------
	// MONTH RENDERING
	// ----------------------------------

	renderMonths() {
		this.monthRow.replaceChildren();
		this.timelineGrid.replaceChildren();

		for (const item of this.monthdata) {
			const month = document.createElement("div");

			month.textContent = SHORT_MONTHS[item.month];

			month.dataset.month =
				`${item.year}-${String(item.month + 1).padStart(2, "0")}`;

			month.addEventListener("click", () => {
				const index = this.monthdata.indexOf(item);
				this.selectMonth(index);
			});

			this.monthRow.append(month);

			const cell = document.createElement("span");
			cell.className = "timeline-grid-cell";

			this.timelineGrid.append(cell);
		}
	}

	// ----------------------------------
	// PLANNER RENDERING
	// ----------------------------------

	renderPlanner() {
		const selected = this.monthdata[this.selectedIndex];

		if (!selected?.planner) return;

		const data = selected.planner;
		const plannerData = data.data;
		const plannerOrder = data.order;

		this.heading.textContent = data.title;

		for (const sectionId of plannerOrder) {
			const section = plannerData[sectionId];

			if (!section) continue;

			const sectionLabel = document.createElement("div");
			sectionLabel.className = "label-section-row";
			sectionLabel.textContent = section.title;

			this.labelList.append(sectionLabel);

			const sectionTimeline = document.createElement("div");
			sectionTimeline.className = "timeline-section-row";

			this.timelineData.append(sectionTimeline);

			// This assumes your planner manager provides slots
			// through the same structure as your previous getState().
			const slots = section.slots ?? [];

			for (const slot of slots) {
				this.labelList.append(
					this.addLabel(section, slot)
				);

				const row = document.createElement("div");
				row.className = "timeline-activity-row";
				row.dataset.slotId = slot.id;

				this.timelineData.append(row);
			}
		}
	}

	addLabel(section, slot) {
		const row = document.createElement("div");
		row.className = "lable-row depth-1";

		if (!slot.hobby) {
			row.classList.add("is-empty");
			row.setAttribute("aria-label", "Empty slot");
			return row;
		}

		const dot = document.createElement("span");
		dot.className = "dot";
		dot.style.backgroundColor = slot.hobby.color;

		const text = document.createElement("span");
		text.className = "lable-text";

		const name = document.createElement("p");
		name.className = "lable-name";
		name.textContent = slot.hobby.name;

		text.append(name);

		row.title = `${section.title}: ${slot.hobby.description}`;
		row.append(dot, text);

		return row;
	}

	// ----------------------------------
	// ACTIVITY BARS
	// ----------------------------------

	hobbyClass(id) {
		return id.replace(/^hobby-/, "");
	}

	renderActivityBars() {
		for (const row of this.timelineData.querySelectorAll(
			".timeline-activity-row"
		)) {
			row.replaceChildren();

			let activeStart = null;
			let activeHobby = null;

			for (
				let displayIndex = 0;
				displayIndex <= this.monthdata.length;
				displayIndex += 1
			) {
				const state =
					displayIndex < this.monthdata.length
						? this.monthdata[displayIndex].planner
						: null;

				const sections = state
					? state.sections ?? []
					: [];

				const slot = sections
					.flatMap(section => section.slots)
					.find(entry => entry.id === row.dataset.slotId);

				const hobby = slot?.hobby ?? null;

				const hobbyChanged =
					hobby?.id !== activeHobby?.id;

				if (activeHobby && (!hobby || hobbyChanged)) {
					const bar = document.createElement("div");

					bar.className =
						`activity-bar ${this.hobbyClass(activeHobby.id)}`;

					bar.style.gridColumn =
						`${activeStart + 1} / ${displayIndex + 1}`;

					bar.style.backgroundColor = activeHobby.color;
					bar.title = activeHobby.name;

					row.append(bar);
					activeStart = null;
				}

				if (hobby && (!activeHobby || hobbyChanged)) {
					activeStart = displayIndex;
				}

				activeHobby = hobby;
			}
		}
	}

	// ----------------------------------
	// LAYOUT
	// ----------------------------------

	updateLayout() {
		const selectedWidth = Math.max(
			MONTH_WIDTH,
			Math.floor(this.timeline.clientWidth / 2)
		);

		const columns = this.monthdata
			.map((_, index) =>
				`${index === this.selectedIndex
					? selectedWidth
					: MONTH_WIDTH}px`
			)
			.join(" ");

		const contentWidth =
			this.monthdata.length * MONTH_WIDTH +
			selectedWidth - MONTH_WIDTH;

		const tailWidth = Math.max(
			0,
			this.timeline.clientWidth - selectedWidth
		);

		this.track.style.setProperty(
			"--content-width",
			`${contentWidth}px`
		);

		this.track.style.setProperty(
			"--tail-width",
			`${tailWidth}px`
		);

		this.monthRow.style.gridTemplateColumns = columns;
		this.monthRow.style.width = `${contentWidth}px`;

		this.timelineGrid.style.gridTemplateColumns = columns;
		this.timelineData.style.width = `${contentWidth}px`;

		this.timelineData
			.querySelectorAll(".timeline-activity-row")
			.forEach(row => {
				row.style.gridTemplateColumns = columns;
				row.style.width = `${contentWidth}px`;
			});

		[...this.monthRow.children].forEach((month, index) => {
			month.classList.toggle(
				"selected",
				index === this.selectedIndex
			);
		});

		[...this.timelineGrid.children].forEach((cell, index) => {
			cell.classList.toggle(
				"selected",
				index === this.selectedIndex
			);
		});
	}

	// ----------------------------------
	// NAVIGATION
	// ----------------------------------

	selectMonth(index, behavior = "smooth") {
		this.selectedIndex = Math.max(
			0,
			Math.min(this.monthdata.length - 1, index)
		);

		this.renderPlanner();
		this.renderActivityBars();
		this.updateLayout();

		this.timeline.scrollTo({
			left: this.selectedIndex * MONTH_WIDTH,
			behavior
		});
	}

	bindEvents() {
		this.timeline.addEventListener(
			"wheel",
			event => {
				const delta =
					Math.abs(event.deltaX) > Math.abs(event.deltaY)
						? event.deltaX
						: event.deltaY;

				if (!delta) return;

				event.preventDefault();

				this.wheelDirection = delta > 0 ? 1 : -1;

				clearTimeout(this.wheelTimer);

				this.wheelTimer = window.setTimeout(() => {
					this.selectMonth(
						this.selectedIndex + this.wheelDirection
					);
				}, 80);
			},
			{ passive: false }
		);

		this.resizeHandler = () => {
			this.updateLayout();

			this.timeline.scrollTo({
				left: this.selectedIndex * MONTH_WIDTH,
				behavior: "auto"
			});
		};

		window.addEventListener("resize", this.resizeHandler);
	}

	destroy() {
		clearTimeout(this.wheelTimer);
		window.removeEventListener("resize", this.resizeHandler);
		this.element.replaceChildren();
	}
}

const planner = new HobbyPlanner(document.querySelector(".mainbody"));
