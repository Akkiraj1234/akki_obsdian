import type { Plugin } from "obsidian";
import { createFeatureContext } from "./context";
import type { FeatureDefinition } from "./feature";
import type { PluginSettings, RootSettings } from "../settings/types";

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

export class AkkiObsidianApp {
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
				dataFilePath: this.settings.dataFilePath,
				showAddButton: typeof raw.hobbies.showQuickAddButton === "boolean" ? raw.hobbies.showQuickAddButton : true,
			};
		}
		if (this.settings.features["new-page"] === undefined && isRecord(raw.newPageInterface)) {
			this.settings.features["new-page"] = { ...raw.newPageInterface };
		}
	}
}
