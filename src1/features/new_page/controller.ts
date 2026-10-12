import { Notice, type App } from "obsidian";
import type { FeatureContext } from "../../core/feature";
import { HabitDatabase } from "./database";
import { renderHobbiesSettings } from "./settings";
import type { HobbiesSettings } from "./types";

/** Coordinates settings validation and the database lifetime for this feature. */
export class HobbiesController {
	private database: HabitDatabase | null = null;

	constructor(private readonly app: App) {}

	async initialize(context: FeatureContext<HobbiesSettings>): Promise<void> {
		await this.openDatabase(context.settingsConfig.databaseFolderPath);
	}

	renderSettings(containerEl: HTMLElement, context: FeatureContext<HobbiesSettings>): void {
		renderHobbiesSettings(containerEl, context, async (folderPath) => {
			const normalized = HabitDatabase.normalizeFolderPath(folderPath);
			if (!normalized) {
				new Notice("Habit tracker: enter a vault-relative folder path without '..'.");
				return false;
			}
			try {
				await this.openDatabase(normalized);
				return true;
			} catch (error) {
				console.error("Habit tracker database could not be opened", error);
				new Notice("Habit tracker: the database folder could not be opened. Check the path and try again.");
				return false;
			}
		});
	}

	private async openDatabase(folderPath: string): Promise<void> {
		const database = new HabitDatabase(this.app.vault);
		await database.open(folderPath, new Date().getFullYear());
		this.database = database;
	}
}
