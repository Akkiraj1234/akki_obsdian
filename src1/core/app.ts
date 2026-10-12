import type { Plugin } from "obsidian";
import type { FeatureDefinition } from "./feature";
import { createFeatureContext } from "./context";
import { PluginSettings, RootSettings } from "../settings/types";


interface RenderableFeature {
	id: string;
	name: string;
	description: string;
	renderSettings: (containerEl: HTMLElement) => void;
}

type SavedSettings = Record<string, unknown>;

function isRecord(value: unknown): value is SavedSettings {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeFeatureSettings<TSettings extends object>(defaults: TSettings, saved: unknown): TSettings {
	return Object.assign({}, defaults, isRecord(saved) ? saved : {});
}

/*
its works is to load setup the app
load all the features and their settings, 
*/

class AkkiObsidianApp {
	readonly features: unknown = [];

	constructor(
		readonly plugin: Plugin,
		private readonly feature: readonly unkown[],
	) {
		this.feature = feature;
	}

	async on_load(): Promise<void> {

	}

	async on_unload(): Promise<void> {

	}

	async settings(): Promise<void> {

	}
}


class AkkiObsidianAppv1 {
	settings: PluginSettings;
	readonly features: RenderableFeature[] = [];

	constructor(
		readonly plugin: Plugin,
		private readonly rootDefaults: RootSettings,
		private readonly definitions: readonly FeatureDefinition<object>[],
	) {
		this.settings = { ...rootDefaults, features: {} };
	}

	async loadSettings(): Promise<void> {
		const saved: unknown = await this.plugin.loadData();
		const raw = isRecord(saved) ? saved : {};
		this.settings = {
			showCompletedTasks: typeof raw.showCompletedTasks === "boolean" ? raw.showCompletedTasks : this.rootDefaults.showCompletedTasks,
			dataFilePath: typeof raw.dataFilePath === "string" ? raw.dataFilePath : this.rootDefaults.dataFilePath,
			features: isRecord(raw.features) ? { ...raw.features } : {},
		};
		this.migrateLegacyFeatureSettings(raw);
	}

	async initialize(): Promise<void> {
		for (const definition of this.definitions) {
			const settingsConfig = this.getFeatureSettings(definition);
			const context = createFeatureContext(this.plugin, settingsConfig, () => this.saveSettings());
			this.features.push({
				id: definition.id,
				name: definition.name,
				description: definition.description,
				renderSettings: (containerEl) => definition.renderSettings(containerEl, context),
			});
			await definition.initialize?.(context);
		}
	}

	async saveSettings(): Promise<void> {
		await this.plugin.saveData(this.settings);
	}

	private getFeatureSettings<TSettings extends object>(definition: FeatureDefinition<TSettings>): TSettings {
		const settingsConfig = mergeFeatureSettings(definition.defaultSettings, this.settings.features[definition.id]);
		this.settings.features[definition.id] = settingsConfig;
		return settingsConfig;
	}

	private migrateLegacyFeatureSettings(raw: SavedSettings): void {
		if (this.settings.features.hobbies === undefined && isRecord(raw.hobbies)) {
			this.settings.features.hobbies = {
				...raw.hobbies,
				databaseFolderPath: typeof raw.hobbies.dataFilePath === "string"
					? raw.hobbies.dataFilePath.replace(/\.[^/.]+$/, "")
					: "Habit tracker data",
				showAddButton: typeof raw.hobbies.showQuickAddButton === "boolean" ? raw.hobbies.showQuickAddButton : true,
			};
		}
		if (this.settings.features["new-page"] === undefined && isRecord(raw.newPageInterface)) {
			this.settings.features["new-page"] = { ...raw.newPageInterface };
		}
	}
}

export { AkkiObsidianApp, AkkiObsidianAppv1 };