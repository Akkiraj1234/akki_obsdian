import { Setting } from "obsidian";
import type { RootSettings } from "./types";

export interface RootSettingsContext {
	settings: RootSettings;
	save: () => Promise<void>;
}

export function renderRootSettings(
	containerEl: HTMLElement,
	context: RootSettingsContext,
): void {
	new Setting(containerEl)
		.setName("Show completed tasks")
		.setDesc("Include completed tasks when task features are displayed.")
		.addToggle((toggle) =>
			toggle.setValue(context.settings.showCompletedTasks).onChange(async (value) => {
				context.settings.showCompletedTasks = value;
				await context.save();
			}),
		);

	new Setting(containerEl)
		.setName("Data file")
		.setDesc("Path to the plugin-wide Markdown file inside your vault.")
		.addText((text) =>
			text.setPlaceholder("Personal/Data.md").setValue(context.settings.dataFilePath).onChange(async (value) => {
				context.settings.dataFilePath = value.trim();
				await context.save();
			}),
		);
}
