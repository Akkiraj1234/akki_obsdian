import { Notice, Setting } from 'obsidian';
import type { Hobby, HobbyInput, MarkDb } from '@/core/markdb/maindb';

export interface HobbyManagerOptions {
    onHobbiesChanged(): Promise<void>;
}

/** Renders the hobby catalogue and its compact create/edit form. */
export async function renderHobbyManager(
    containerEl: HTMLElement,
    db: MarkDb,
    options: HobbyManagerOptions,
): Promise<void> {
    containerEl.empty();
    containerEl.addClass('akki-hobby-manager');
    const heading = containerEl.createDiv({ cls: 'akki-hobby-pane-heading' });
    heading.createDiv({ text: 'Hobby manager', cls: 'akki-hobby-pane-title' });
    const add = heading.createEl('button', { text: '+', cls: 'clickable-icon akki-hobby-add-button', attr: { 'aria-label': 'Add hobby' } });
    add.addEventListener('click', () => renderHobbyEditor(containerEl, db, options));

    const hobbies = await db.loadHobbies();
    if (hobbies.length === 0) {
        const empty = containerEl.createDiv({ cls: 'akki-hobby-empty' });
        empty.createEl('p', { text: 'No hobbies yet.' });
        const first = empty.createEl('button', { text: 'Add your first hobby', cls: 'mod-cta' });
        first.addEventListener('click', () => renderHobbyEditor(containerEl, db, options));
        return;
    }

    const list = containerEl.createDiv({ cls: 'akki-hobby-list' });
    for (const hobby of hobbies) renderHobbyRow(list, hobby, containerEl, db, options);
}

function renderHobbyRow(
    parent: HTMLElement,
    hobby: Hobby,
    containerEl: HTMLElement,
    db: MarkDb,
    options: HobbyManagerOptions,
): void {
    const row = parent.createDiv({ cls: 'akki-hobby-row' });
    const identity = row.createDiv({ cls: 'akki-hobby-row-identity' });
    identity.createSpan({ text: String(hobby.id).padStart(2, '0'), cls: 'akki-hobby-id' });
    const details = identity.createDiv();
    details.createEl('strong', { text: hobby.name });
    details.createEl('small', { text: `${hobby.category} · ${hobby.target} ${hobby.unit}` });
    const controls = row.createDiv({ cls: 'akki-hobby-row-controls' });
    const edit = controls.createEl('button', { text: 'Edit' });
    edit.addEventListener('click', () => renderHobbyEditor(containerEl, db, options, hobby));
    const remove = controls.createEl('button', { text: 'Delete', cls: 'mod-warning' });
    remove.addEventListener('click', () => void deleteHobby(hobby, containerEl, db, options));
}

function renderHobbyEditor(
    containerEl: HTMLElement,
    db: MarkDb,
    options: HobbyManagerOptions,
    existing?: Hobby,
): void {
    containerEl.empty();
    const values: HobbyInput = existing ?? {
        name: '', category: 'hobby', description: '', unit: 'percent', target: 100,
    };
    let name = values.name;
    let category = values.category;
    let description = values.description;
    let unit = values.unit;
    let target = values.target;

    const heading = containerEl.createDiv({ cls: 'akki-hobby-pane-heading' });
    heading.createDiv({ text: existing ? 'Edit hobby' : 'New hobby', cls: 'akki-hobby-pane-title' });
    const back = heading.createEl('button', { text: 'Back' });
    back.addEventListener('click', () => void renderHobbyManager(containerEl, db, options));
    new Setting(containerEl).setName('Name')
        .addText((text) => text.setValue(name).onChange((value) => { name = value; }));
    new Setting(containerEl).setName('Type')
        .addDropdown((dropdown) => dropdown.addOption('hobby', 'Hobby').addOption('skill', 'Skill')
            .setValue(category).onChange((value) => { category = value === 'skill' ? 'skill' : 'hobby'; }));
    new Setting(containerEl).setName('Target and unit')
        .addText((text) => text.setValue(String(target)).onChange((value) => { target = Number(value); }))
        .addText((text) => text.setValue(unit).onChange((value) => { unit = value; }));
    new Setting(containerEl).setName('Description')
        .addTextArea((text) => text.setValue(description).onChange((value) => { description = value; }));
    const save = containerEl.createEl('button', { text: 'Save hobby', cls: 'mod-cta akki-hobby-save-button' });
    save.addEventListener('click', () => void saveHobby(existing?.id, { name, category, description, unit, target }, containerEl, db, options));
}

async function saveHobby(
    id: number | undefined,
    input: HobbyInput,
    containerEl: HTMLElement,
    db: MarkDb,
    options: HobbyManagerOptions,
): Promise<void> {
    try {
        if (id === undefined) await db.createHobby(input);
        else await db.updateHobby(id, input);
        await options.onHobbiesChanged();
        new Notice('Hobby saved.');
    } catch (error) {
        new Notice(error instanceof Error ? error.message : 'Unable to save hobby.');
    }
}

async function deleteHobby(
    hobby: Hobby,
    containerEl: HTMLElement,
    db: MarkDb,
    options: HobbyManagerOptions,
): Promise<void> {
    await db.deleteHobby(hobby.id);
    await options.onHobbiesChanged();
    new Notice(`Deleted ${hobby.name}.`);
}
