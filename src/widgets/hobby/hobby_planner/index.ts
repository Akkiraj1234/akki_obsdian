import type { MarkDb } from '@/core/markdb/maindb';

/** Placeholder planner UI, ready to receive the monthly plan data model. */
export async function renderHobbyPlanner(containerEl: HTMLElement, db: MarkDb): Promise<void> {
    containerEl.empty();
    const date = new Date();
    const title = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(date);
    containerEl.createDiv({ text: `${title} planner`, cls: 'akki-hobby-pane-title' });
    containerEl.createEl('p', { text: 'Choose the hobbies you want to focus on this month.', cls: 'setting-item-description' });
    const hobbies = await db.loadHobbies();
    const list = containerEl.createDiv({ cls: 'akki-planner-list' });
    for (const hobby of hobbies) {
        const item = list.createEl('label', { cls: 'akki-planner-item' });
        item.createEl('input', { type: 'checkbox' });
        item.createSpan({ text: hobby.name });
    }
    if (hobbies.length === 0) list.createSpan({ text: 'Add hobbies in Hobby manager to start planning.' });
}
