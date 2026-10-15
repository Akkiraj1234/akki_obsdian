import type { Hobby, MarkDb } from '@/core/markdb/maindb';

/** Renders a visual, in-memory tracker prototype for the current year. */
export async function renderHobbyTracker(containerEl: HTMLElement, db: MarkDb): Promise<void> {
    containerEl.empty();
    containerEl.addClass('akki-hobby-tracker');
    const year = new Date().getFullYear();
    const hobbies = await db.loadHobbies();
    containerEl.createDiv({ text: `${year} hobby tracker`, cls: 'akki-hobby-pane-title' });
    containerEl.createEl('p', { text: 'Select today’s square to mark work complete. Tracker persistence comes next.', cls: 'setting-item-description' });
    if (hobbies.length === 0) {
        containerEl.createDiv({ text: 'Add hobbies in Hobby manager before tracking them.', cls: 'akki-hobby-empty' });
        return;
    }
    renderHobbyHeaders(containerEl, hobbies);
    renderHeatmap(containerEl, hobbies);
}

function renderHobbyHeaders(parent: HTMLElement, hobbies: Hobby[]): void {
    const headers = parent.createDiv({ cls: 'akki-tracker-hobby-headers' });
    for (const hobby of hobbies) {
        const header = headers.createDiv({ cls: 'akki-tracker-hobby-header' });
        header.createSpan({ text: String(hobby.id).padStart(2, '0'), cls: 'akki-hobby-id' });
        header.createSpan({ text: hobby.name });
    }
}

function renderHeatmap(parent: HTMLElement, hobbies: Hobby[]): void {
    const heatmap = parent.createDiv({ cls: 'akki-tracker-heatmap' });
    const today = dayOfYear(new Date());
    for (const hobby of hobbies) {
        const row = heatmap.createDiv({ cls: 'akki-tracker-heatmap-row' });
        row.createSpan({ text: hobby.name, cls: 'akki-tracker-row-label' });
        const cells = row.createDiv({ cls: 'akki-tracker-cells' });
        for (let day = 1; day <= 365; day += 1) {
            const cell = cells.createEl('button', {
                cls: `akki-tracker-cell${day === today ? ' is-today' : ''}`,
                attr: { 'aria-label': `${hobby.name}, day ${day}` },
            });
            if (day === today) cell.addEventListener('click', () => cell.toggleClass('is-complete', !cell.hasClass('is-complete')));
        }
    }
}

function dayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}
