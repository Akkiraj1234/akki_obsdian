
import {
	SHORT_MONTHS,
	HobbyManager,
	ActivityManager,
	ActivityHeatmapManager,
	HobbyPlannerManager
} from "../dataFacther.js";

const hobbyManager = new HobbyManager();
const activityManager = new ActivityManager();
const activityHeatmapManager = new ActivityHeatmapManager();
const hobbyPlannerManager = new HobbyPlannerManager();

const MONTH_WIDTH = 100;

class HobbyPlanner {
	constructor(element) {
		if (!element) {
			throw new Error("HobbyPlanner requires a valid HTML element");
		}

		this.element = element;

		this.selectedIndex = 0;
		this.monthdata = [];

		this.wheelTimer = null;
		this.wheelDirection = 0;

		this.createLayout();
		this.cacheElements();

		this.initialize();
	}

	initialize() {
		this.prepareHobbyData();
		this.render();
		this.bindEvents();
	}

	// ----------------------------------
	// DATA PREPARATION
	// ----------------------------------

	prepareHobbyData() {
		const { latestYear, latestMonth } =
			hobbyPlannerManager.latest_year_and_month();

		if (
			!Number.isInteger(latestMonth) ||
			latestMonth < 0 ||
			latestMonth > 11
		) {
			throw new Error("Invalid latest month");
		}

		this.latestYear = latestYear;
		this.latestMonth = latestMonth;

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

	// ----------------------------------
	// DOM
	// ----------------------------------

	createLayout() {
		this.element.innerHTML = `
            <main class="tracker">
                <section class="labels" aria-label="Hobby planner labels">
                    <p class="lable-heading"></p>
                    <div class="label-list"></div>
                </section>

                <section
                    class="timeline-viewport"
                    aria-label="Hobby planner timeline"
                >
                    <div class="timeline">
                        <div class="timeline-track">
                            <div class="timeline-months-row"></div>

                            <div class="timeline-data">
                                <div
                                    class="timeline-grid"
                                    aria-hidden="true"
                                ></div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        `;
	}

	cacheElements() {
		this.heading = this.element.querySelector(".lable-heading");
		this.labelList = this.element.querySelector(".label-list");

		this.timeline = this.element.querySelector(".timeline");
		this.track = this.element.querySelector(".timeline-track");

		this.monthRow = this.element.querySelector(
			".timeline-months-row"
		);

		this.timelineData = this.element.querySelector(".timeline-data");
		this.timelineGrid = this.element.querySelector(".timeline-grid");
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
