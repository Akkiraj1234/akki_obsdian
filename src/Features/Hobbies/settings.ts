import { Setting } from "obsidian";
import type { FeatureContext } from "../../feature";
import type { HobbiesSettings } from "./types";

/*
in this setting we are maging hobbies and skills for that we need to import hobbies
data currently  the setting its support are these

1. path to the db file 
2. show hobbie add button
3. shwo quick hobbies ticker 

*/

const Defination = `
this is the setting for hobbies managemnt
`;


export function renderHobbiesSettings(
	containerEl: HTMLElement,
	context: FeatureContext<HobbiesSettings>,
): void {
	const { settings, saveSettings } = context;

	new Setting(containerEl)
		.setName("Database file")
		.setDesc("Path to the Markdown file inside your vault.")
		.addText((text) =>
			text
				.setPlaceholder("Personal/Hobbies.md")
				.setValue(settings.dataFilePath)
				.onChange(async (value) => {
					settings.dataFilePath = value.trim();
					await saveSettings();
				}),
		);

	new Setting(containerEl)
		.setName("Show hobby add button")
		.setDesc("Display a button for quickly adding a hobby.")
		.addToggle((toggle) =>
			toggle
				.setValue(settings.showAddButton)
				.onChange(async (value) => {
					settings.showAddButton = value;
					await saveSettings();
				}),
		);

	new Setting(containerEl)
		.setName("Show quick hobbies ticker")
		.setDesc("Display the quick-access hobbies ticker.")
		.addToggle((toggle) =>
			toggle
				.setValue(settings.showQuickTicker)
				.onChange(async (value) => {
					settings.showQuickTicker = value;
					await saveSettings();
				}),
		);
}