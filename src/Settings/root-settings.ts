
import { Setting } from "obsidian";
import type AkkiObsidianPlugin from "../main";

export function renderRootSettings(
	containerEl: HTMLElement,
	plugin: AkkiObsidianPlugin,
): void {
	new Setting(containerEl)
		.setName("Show completed tasks")
		.setDesc("Include completed tasks when task features are displayed.")
		.addToggle((toggle) =>
			toggle
				.setValue(plugin.settings.showCompletedTasks)
				.onChange(async (value) => {
					plugin.settings.showCompletedTasks = value;
					await plugin.saveSettings();
				}),
		);

	new Setting(containerEl)
		.setName("Data file")
		.setDesc("Path to the Markdown file inside your vault.")
		.addText((text) =>
			text
				.setPlaceholder("Personal/Data.md")
				.setValue(plugin.settings.dataFilePath)
				.onChange(async (value) => {
					plugin.settings.dataFilePath = value.trim();
					await plugin.saveSettings();
				}),
		);
}
