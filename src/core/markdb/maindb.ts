import type { Vault } from 'obsidian';

/** A hobby definition shared by the planner and tracker. */
export interface Hobby {
    id: number;
    name: string;
    category: 'hobby' | 'skill';
    description: string;
    unit: string;
    target: number;
    totalDays: number;
    totalHours: number;
    createdAt: string;
}

export type HobbyInput = Pick<Hobby, 'name' | 'category' | 'description' | 'unit' | 'target'>;

const HOBBIES_FILE = 'Hobbies.md';
const DATA_MARKER = '<!-- akki-hobbies:';

/** Markdown-backed data store for the hobby widgets. */
export class MarkDb {
    constructor(private readonly vault: Vault, private storagePath: string) {}

    setStoragePath(path: string): void { this.storagePath = normalizePath(path); }
    getStoragePath(): string { return this.storagePath; }
    getHobbiesPath(): string { return joinPath(this.storagePath, HOBBIES_FILE); }
    getPlannerPath(year: number): string { return joinPath(this.storagePath, 'planner', `${year}.md`); }
    getTrackerPath(year: number): string { return joinPath(this.storagePath, 'tracker', `${year}.md`); }

    async loadHobbies(): Promise<Hobby[]> {
        const path = this.getHobbiesPath();
        if (!(await this.vault.adapter.exists(path))) return [];
        const content = await this.vault.adapter.read(path);
        const markerStart = content.indexOf(DATA_MARKER);
        const markerEnd = content.indexOf('-->', markerStart);
        if (markerStart === -1 || markerEnd === -1) return [];
        try {
            const raw = content.slice(markerStart + DATA_MARKER.length, markerEnd).trim();
            const parsed: unknown = JSON.parse(raw);
            return Array.isArray(parsed)
                ? parsed.map(toHobby).filter((hobby): hobby is Hobby => hobby !== null)
                : [];
        } catch {
            return [];
        }
    }

    async createHobby(input: HobbyInput): Promise<Hobby> {
        const hobbies = await this.loadHobbies();
        const hobby: Hobby = {
            id: Math.max(0, ...hobbies.map((item) => item.id)) + 1,
            ...sanitizeInput(input), totalDays: 0, totalHours: 0,
            createdAt: new Date().toISOString(),
        };
        await this.saveHobbies([...hobbies, hobby]);
        return hobby;
    }

    async updateHobby(id: number, input: HobbyInput): Promise<Hobby> {
        const hobbies = await this.loadHobbies();
        const index = hobbies.findIndex((hobby) => hobby.id === id);
        if (index === -1) throw new Error('This hobby no longer exists.');
        const updated: Hobby = { ...hobbies[index]!, ...sanitizeInput(input) };
        hobbies[index] = updated;
        await this.saveHobbies(hobbies);
        return updated;
    }

    async deleteHobby(id: number): Promise<void> {
        const hobbies = await this.loadHobbies();
        await this.saveHobbies(hobbies.filter((hobby) => hobby.id !== id));
    }

    async ensureYearFiles(year: number): Promise<void> {
        await this.ensureFile(this.getPlannerPath(year), `# Hobby planner ${year}\n\nPlans for each month will be stored here.\n`);
        await this.ensureFile(this.getTrackerPath(year), `# Hobby tracker ${year}\n\nDaily progress entries will be stored here.\n`);
    }

    private async saveHobbies(hobbies: Hobby[]): Promise<void> {
        const sorted = [...hobbies].sort((a, b) => a.id - b.id);
        const rows = sorted.length === 0
            ? '| — | Add your first hobby from the Hobby manager. | — | — | — |'
            : sorted.map((hobby) => `| ${hobby.id} | ${escapeCell(hobby.name)} | ${hobby.category} | ${hobby.totalDays} | ${hobby.totalHours} |`).join('\n');
        const content = [
            '# Hobbies', '',
            'This file is managed by Akki Obsidian. Use the Hobby manager to make changes.', '',
            '| ID | Name | Type | Days | Hours |', '| --- | --- | --- | ---: | ---: |', rows, '',
            `${DATA_MARKER}${JSON.stringify(sorted)} -->`, '',
        ].join('\n');
        await this.ensureFolder(this.storagePath);
        await this.vault.adapter.write(this.getHobbiesPath(), content);
    }

    private async ensureFile(path: string, content: string): Promise<void> {
        if (await this.vault.adapter.exists(path)) return;
        await this.ensureFolder(path.split('/').slice(0, -1).join('/'));
        await this.vault.adapter.write(path, content);
    }

    private async ensureFolder(path: string): Promise<void> {
        if (path && !(await this.vault.adapter.exists(path))) await this.vault.adapter.mkdir(path);
    }
}

function sanitizeInput(input: HobbyInput): HobbyInput {
    const name = input.name.trim();
    if (!name) throw new Error('A hobby needs a name.');
    return {
        name,
        category: input.category === 'skill' ? 'skill' : 'hobby',
        description: input.description.trim(),
        unit: input.unit.trim() || 'percent',
        target: Number.isFinite(input.target) && input.target > 0 ? input.target : 100,
    };
}

function toHobby(value: unknown): Hobby | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    const item = value as Record<string, unknown>;
    if (typeof item.id !== 'number' || typeof item.name !== 'string') return null;
    return {
        id: item.id, name: item.name, category: item.category === 'skill' ? 'skill' : 'hobby',
        description: typeof item.description === 'string' ? item.description : '',
        unit: typeof item.unit === 'string' ? item.unit : 'percent',
        target: typeof item.target === 'number' ? item.target : 100,
        totalDays: typeof item.totalDays === 'number' ? item.totalDays : 0,
        totalHours: typeof item.totalHours === 'number' ? item.totalHours : 0,
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
    };
}

function normalizePath(path: string): string { return path.trim().replace(/^\/+|\/+$/g, '') || 'akki/hobbies'; }
function joinPath(...parts: string[]): string { return parts.filter(Boolean).join('/').replace(/\/+/g, '/'); }
function escapeCell(value: string): string { return value.replaceAll('|', '\\|').replaceAll('\n', ' '); }
