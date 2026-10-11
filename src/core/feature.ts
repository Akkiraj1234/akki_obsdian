import type { App } from "obsidian";

export interface FeatureContext<TSettings> {
	app: App;
	settingsConfig: TSettings;
	updateSettings: (update: (settings: TSettings) => void) => Promise<void>;
	registerCleanup: (cleanup: () => void) => void;
}

export interface FeatureDefinition<TSettings extends object> {
	id: string;
	name: string;
	description: string;
	defaultSettings: TSettings;
	renderSettings(
		containerEl: HTMLElement,
		context: FeatureContext<TSettings>,
	): void;
	initialize?(context: FeatureContext<TSettings>): void | Promise<void>;
}
