import { Notice, TFile, type Vault } from "obsidian";

export const HABIT_INDEX_FILE = "habits.md";
const INDEX_MARKER = "habit-ticker-index: 1";
const YEAR_MARKER = "habit-ticker-year: 1";

export interface HabitDatabaseIndex {
	path: string;
	content: string;
}

export interface HabitYearDatabase {
	year: number;
	path: string;
	content: string;
}

/**
 * Owns the on-disk Markdown database. The index and only the years requested
 * by the UI live in memory; this keeps startup inexpensive as history grows.
 */
export class HabitDatabase {
	private readonly years = new Map<number, HabitYearDatabase>();
	private index: HabitDatabaseIndex | null = null;

	constructor(private readonly vault: Vault) {}

	static normalizeFolderPath(value: string): string | null {
		const path = value.trim().replaceAll("\\", "/").replace(/^\/+|\/+$/g, "");
		if (!path || path.split("/").some((part) => !part || part === "." || part === "..")) {
			return null;
		}
		return path;
	}

	async open(folderPath: string, year: number): Promise<void> {
		const folder = HabitDatabase.normalizeFolderPath(folderPath);
		if (!folder) {
			throw new Error("Choose a folder inside the vault. Paths cannot be empty or use '..'.");
		}

		await this.ensureFolder(folder);
		this.index = await this.openIndex(folder);
		await this.loadYear(folder, year);
	}

	getIndex(): HabitDatabaseIndex | null {
		return this.index;
	}

	getLoadedYear(year: number): HabitYearDatabase | null {
		return this.years.get(year) ?? null;
	}

	async loadYear(folderPath: string, year: number): Promise<HabitYearDatabase> {
		const folder = HabitDatabase.normalizeFolderPath(folderPath);
		if (!folder) throw new Error("Invalid database folder.");

		const path = `${folder}/${year}.md`;
		const existing = this.vault.getFileByPath(path);
		if (!existing) {
			const content = createYearContent(year);
			await this.vault.create(path, content);
			const database = { year, path, content };
			this.years.set(year, database);
			new Notice(`Habit tracker: created ${year}.md.`);
			return database;
		}

		const content = await this.vault.read(existing);
		if (!isValidYear(content, year)) {
			await this.backUpAndReplace(existing, createYearContent(year));
			new Notice(`Habit tracker: ${year}.md was invalid. A backup was made and a new file was created.`);
			const database = { year, path, content: createYearContent(year) };
			this.years.set(year, database);
			return database;
		}

		const database = { year, path, content };
		this.years.set(year, database);
		return database;
	}

	private async ensureFolder(folder: string): Promise<void> {
		if (this.vault.getAbstractFileByPath(folder)) return;
		await this.vault.createFolder(folder);
		new Notice("Habit tracker: created the database folder.");
	}

	private async openIndex(folder: string): Promise<HabitDatabaseIndex> {
		const path = `${folder}/${HABIT_INDEX_FILE}`;
		const existing = this.vault.getFileByPath(path);
		if (!existing) {
			const content = createIndexContent();
			await this.vault.create(path, content);
			new Notice("Habit tracker: created habits.md.");
			return { path, content };
		}

		const content = await this.vault.read(existing);
		if (!content.trim() || !content.includes(INDEX_MARKER)) {
			const replacement = createIndexContent();
			await this.backUpAndReplace(existing, replacement);
			new Notice("Habit tracker: habits.md was invalid. A backup was made and a new file was created.");
			return { path, content: replacement };
		}
		return { path, content };
	}

	private async backUpAndReplace(file: TFile, replacement: string): Promise<void> {
		const backupPath = `${file.path}.invalid-${Date.now()}.bak`;
		await this.vault.rename(file, backupPath);
		await this.vault.create(file.path, replacement);
	}
}

function createIndexContent(): string {
	return `---\n${INDEX_MARKER}\n---\n\n# Habit index\n\n<!-- Add stable habit IDs here. Deleted habits should be marked archived, not removed. -->\n`;
}

function createYearContent(year: number): string {
	return `---\n${YEAR_MARKER}\nyear: ${year}\n---\n\n# ${year}\n\n<!-- One Markdown section per month. Daily data will be added here. -->\n`;
}

function isValidYear(content: string, year: number): boolean {
	return content.includes(YEAR_MARKER) && content.includes(`year: ${year}`);
}
