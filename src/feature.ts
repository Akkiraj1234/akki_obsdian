import type { App } from "obsidian";

export interface FeatureContext<TSettings> {
	app: App;
	settings: TSettings;
	saveSettings: () => Promise<void>;
}

export interface FeatureDefinition<TSettings> {
	id: string;
	name: string;
	description: string;

	defaultSettings: TSettings;

	renderSettings: (
		containerEl: HTMLElement,
		context: FeatureContext<TSettings>,
	) => void;
}