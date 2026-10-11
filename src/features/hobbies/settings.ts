import { Setting } from "obsidian";
import type { FeatureContext } from "../../core/feature";
import type { HobbiesSettings } from "./types";


function renderHobbiesSettings(
	containerEl: HTMLElement,
	context: FeatureContext<HobbiesSettings>
): void 
{
	const { settingsConfig, updateSettings } = context;

	new Setting(containerEl)
		.setName("DataBase File")
		.setDesc("path to the hobbies Markdown database inside your vault.")
		.addText((text) => 
		text
			.setPlaceholder("Personal/Hobbies.md")
			.setValue(settingsConfig.dataFilePath)
			.onChange(async (value) => {
				await updateSettings((settings) => { settings.dataFilePath = value.trim(); });
			})
		);

	new Setting(containerEl)
		.setName("show hobby add button")
		.setDesc("display the icon on right panel to quicky open a hobby add button and manage button")
		.addToggle((toggle) => 
		toggle
			.setValue(settingsConfig.showAddButton)
			.onChange(async (value) => {
				await updateSettings((setting) => {setting.showAddButton = value; });
			})
		);

	new Setting(containerEl)
		.setName("Show quick hobbies ticker")
		.setDesc("display the quck hobbies ticker in left panel.")
		.addToggle((toggle) => 
		toggle
			.setValue(settingsConfig.showQuickTicker)
			.onChange(async (value) => {
				await updateSettings((setting) => {setting.showQuickTicker = value; });
			})
		);
}

export {
	renderHobbiesSettings
}
