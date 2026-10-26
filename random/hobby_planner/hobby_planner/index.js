import { HobbyPlanner } from '../fakedata.js';

const MONTH_WIDTH = 100;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const planner = new HobbyPlanner();
const latestYear = Math.max(...Object.keys(planner.data).map(Number));
const latestMonth = planner.data[latestYear].latestMonth;
const lastMonthIndex = MONTHS.findIndex((month) => month.toLowerCase().startsWith(latestMonth));
const monthIndexes = Array.from({ length: lastMonthIndex + 1 }, (_, index) => index).reverse();

const timeline = document.querySelector('#timeline');
const track = document.querySelector('#timelineTrack');
const heading = document.querySelector('#lable-heading');
const labelList = document.querySelector('#lable-lists');
const monthRow = document.querySelector('.timeline-months-row');
const timelineData = document.querySelector('#timelineData');
const timelineGrid = document.querySelector('#timelineGrid');

let selectedIndex = 0;
let wheelTimer;
let wheelDirection = 0;

function hobbyClass(id) {
	return id.replace(/^hobby-/, '');
}

function getState(index) {
	const monthIndex = monthIndexes[index];
	return planner.get(latestYear, monthIndex + 1);
}

function addLabel(section, slot) {
	const row = document.createElement('div');
	row.className = 'lable-row depth-1';

	if (!slot.hobby) {
		row.classList.add('is-empty');
		row.setAttribute('aria-label', 'Empty slot');
		return row;
	}

	const dot = document.createElement('span');
	dot.className = 'dot';
	dot.style.backgroundColor = slot.hobby.color;

	const text = document.createElement('span');
	text.className = 'lable-text';
	const name = document.createElement('p');
	name.className = 'lable-name';
	name.textContent = slot.hobby.name;
	text.append(name);

	row.title = `${section.title}: ${slot.hobby.description}`;
	row.append(dot, text);
	return row;
}

function renderPlanner() {
	const state = getState(selectedIndex);
	if (!state) return;

	heading.textContent = state.title;
	labelList.replaceChildren();
	timelineData.replaceChildren(timelineGrid);

	for (const section of state.sections) {
		const sectionLabel = document.createElement('div');
		sectionLabel.className = 'label-section-row';
		sectionLabel.textContent = section.title;
		labelList.append(sectionLabel);

		const sectionTimeline = document.createElement('div');
		sectionTimeline.className = 'timeline-section-row';
		timelineData.append(sectionTimeline);

		for (const slot of section.slots) {
			labelList.append(addLabel(section, slot));

			const row = document.createElement('div');
			row.className = 'timeline-activity-row';
			row.dataset.slotId = slot.id;
			timelineData.append(row);
		}
	}
}

function renderMonths() {
	monthRow.replaceChildren();
	timelineGrid.replaceChildren();

	for (const monthIndex of monthIndexes) {
		const month = document.createElement('div');
		month.textContent = MONTHS[monthIndex];
		month.dataset.month = `${latestYear}-${String(monthIndex + 1).padStart(2, '0')}`;
		month.addEventListener('click', () => selectMonth(monthIndexes.indexOf(monthIndex)));
		monthRow.append(month);

		const cell = document.createElement('span');
		cell.className = 'timeline-grid-cell';
		timelineGrid.append(cell);
	}
}

function renderActivityBars() {
	for (const row of timelineData.querySelectorAll('.timeline-activity-row')) {
		row.replaceChildren();
		let activeStart = null;
		let activeHobby = null;

		for (let displayIndex = 0; displayIndex <= monthIndexes.length; displayIndex += 1) {
			const state = displayIndex < monthIndexes.length ? getState(displayIndex) : null;
			const slot = state?.sections
				.flatMap((section) => section.slots)
				.find((entry) => entry.id === row.dataset.slotId);
			const hobby = slot?.hobby ?? null;
			const hobbyChanged = hobby?.id !== activeHobby?.id;

			if (activeHobby && (!hobby || hobbyChanged)) {
				const bar = document.createElement('div');
				bar.className = `activity-bar ${hobbyClass(activeHobby.id)}`;
				bar.style.gridColumn = `${activeStart + 1} / ${displayIndex + 1}`;
				bar.style.backgroundColor = activeHobby.color;
				bar.title = activeHobby.name;
				row.append(bar);
				activeStart = null;
			}

			if (hobby && (!activeHobby || hobbyChanged)) activeStart = displayIndex;
			activeHobby = hobby;
		}
	}
}

function updateLayout() {
	const selectedWidth = Math.max(MONTH_WIDTH, Math.floor(timeline.clientWidth / 2));
	const columns = monthIndexes
		.map((_, index) => `${index === selectedIndex ? selectedWidth : MONTH_WIDTH}px`)
		.join(' ');
	const contentWidth = monthIndexes.length * MONTH_WIDTH + selectedWidth - MONTH_WIDTH;
	const tailWidth = Math.max(0, timeline.clientWidth - selectedWidth);

	track.style.setProperty('--content-width', `${contentWidth}px`);
	track.style.setProperty('--tail-width', `${tailWidth}px`);
	monthRow.style.gridTemplateColumns = columns;
	monthRow.style.width = `${contentWidth}px`;
	timelineGrid.style.gridTemplateColumns = columns;
	timelineData.style.width = `${contentWidth}px`;

	timelineData.querySelectorAll('.timeline-activity-row').forEach((row) => {
		row.style.gridTemplateColumns = columns;
		row.style.width = `${contentWidth}px`;
	});

	[...monthRow.children].forEach((month, index) =>
		month.classList.toggle('selected', index === selectedIndex),
	);
	[...timelineGrid.children].forEach((cell, index) =>
		cell.classList.toggle('selected', index === selectedIndex),
	);
}

function selectMonth(index, behavior = 'smooth') {
	selectedIndex = Math.max(0, Math.min(monthIndexes.length - 1, index));
	renderPlanner();
	renderActivityBars();
	updateLayout();
	timeline.scrollTo({ left: selectedIndex * MONTH_WIDTH, behavior });
}

timeline.addEventListener(
	'wheel',
	(event) => {
		const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
		if (!delta) return;
		event.preventDefault();
		wheelDirection = delta > 0 ? 1 : -1;
		clearTimeout(wheelTimer);
		wheelTimer = window.setTimeout(() => selectMonth(selectedIndex + wheelDirection), 80);
	},
	{ passive: false },
);

window.addEventListener('resize', () => {
	updateLayout();
	timeline.scrollTo({ left: selectedIndex * MONTH_WIDTH, behavior: 'auto' });
});

renderMonths();
selectMonth(0, 'auto');
