import { Notice, setIcon } from 'obsidian';
import type { Hobby, MarkDb } from '@/core/markdb/maindb';


/** Renders the shared add-and-delete hobby list. */
export async function renderHobbyManager( containerEl: HTMLElement, db: MarkDb ): Promise<void> {
    containerEl.empty();
    containerEl.addClass('akki-hobby-manager');
    containerEl.createEl('h2', { text: 'Hobbies', cls: 'akki-hobby-manager-title' });
    const form = containerEl.createDiv({ cls: 'akki-hobby-manager-form' });
    const input = form.createEl('input', {
        type: 'text',
        placeholder: 'Add a hobby',
        attr: { 'aria-label': 'Hobby name', maxlength: '100' },
    });
    const add = form.createEl('button', {
        cls: 'clickable-icon akki-hobby-add-button',
        attr: { 'aria-label': 'Add hobby', title: 'Add hobby' },
    });
    setIcon(add, 'plus');
    add.addEventListener('click', () => void addHobby(input.value, input, containerEl, db));
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') void addHobby(input.value, input, containerEl, db);
    });

    const hobbies = await db.loadHobbies();
    if (hobbies.length === 0) {
        containerEl.createDiv({ text: 'No hobbies yet.', cls: 'akki-hobby-empty' });
        return;
    }

    const list = containerEl.createDiv({ cls: 'akki-hobby-list' });
    for (const hobby of hobbies) renderHobbyRow(list, hobby, containerEl, db);
}

function renderHobbyRow(
    parent: HTMLElement,
    hobby: Hobby,
    containerEl: HTMLElement,
    db: MarkDb,
): void {
    const row = parent.createDiv({ cls: 'akki-hobby-row' });
    row.createSpan({ text: hobby.name, cls: 'akki-hobby-name' });
    const remove = row.createEl('button', {
        cls: 'clickable-icon akki-hobby-delete-button',
        attr: { 'aria-label': `Delete ${hobby.name}`, title: 'Delete hobby' },
    });
    setIcon(remove, 'trash-2');
    remove.addEventListener('click', () => void deleteHobby(hobby, containerEl, db));
}

async function addHobby(name: string, input: HTMLInputElement, containerEl: HTMLElement, db: MarkDb): Promise<void> {
    const trimmedName = name.trim();
    if (!trimmedName) {
        input.focus();
        return;
    }
    try {
        await db.createHobby({
            name: trimmedName,
            category: 'hobby',
            description: '',
            unit: 'times',
            target: 1,
        });
        await renderHobbyManager(containerEl, db);
        new Notice(`Added ${trimmedName}.`);
    } catch (error) {
        new Notice(error instanceof Error ? error.message : 'Unable to add hobby.');
    }
}

async function deleteHobby(
    hobby: Hobby,
    containerEl: HTMLElement,
    db: MarkDb,
): Promise<void> {
    try {
        await db.deleteHobby(hobby.id);
        await renderHobbyManager(containerEl, db);
        new Notice(`Deleted ${hobby.name}.`);
    } catch (error) {
        new Notice(error instanceof Error ? error.message : 'Unable to delete hobby.');
    }
}
