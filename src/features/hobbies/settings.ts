import { Setting } from "obsidian";
import type { FeatureContext } from "../../core/feature";
import type { HobbiesSettings } from "./types";

export function renderHobbiesSettings(containerEl: HTMLElement, context: FeatureContext<HobbiesSettings>): void {
	const { settingsConfig, updateSettings } = context;
	new Setting(containerEl).setName("Database file").setDesc("Path to the hobbies Markdown database inside your vault.").addText((text) =>
		text.setPlaceholder("Personal/Hobbies.md").setValue(settingsConfig.dataFilePath).onChange(async (value) => {
			await updateSettings((settings) => { settings.dataFilePath = value.trim(); });
		}),
	);
	new Setting(containerEl).setName("Show hobby add button").setDesc("Display a button for quickly adding a hobby.").addToggle((toggle) =>
		toggle.setValue(settingsConfig.showAddButton).onChange(async (value) => {
			await updateSettings((settings) => { settings.showAddButton = value; });
		}),
	);
	new Setting(containerEl).setName("Show quick hobbies ticker").setDesc("Display the quick-access hobbies ticker.").addToggle((toggle) =>
		toggle.setValue(settingsConfig.showQuickTicker).onChange(async (value) => {
			await updateSettings((settings) => { settings.showQuickTicker = value; });
		}),
	);
}
