import { Setting } from "obsidian";
import type { FeatureContext } from "../../core/feature";
import type { HobbiesSettings } from "./types";

type FolderChangeHandler = (folderPath: string) => Promise<boolean>;

function renderHobbiesSettings(
	containerEl: HTMLElement,
	context: FeatureContext<HobbiesSettings>,
	onFolderChange: FolderChangeHandler,
): void 
{
	const { settingsConfig, updateSettings } = context;
	let folderPath = settingsConfig.databaseFolderPath;

	new Setting(containerEl)
		.setName("Database folder")
		.setDesc("Vault-relative folder for habits.md and one Markdown file per year.")
		.addText((text) => 
		text
			.setPlaceholder("Habit tracker data")
			.setValue(folderPath)
			.onChange(async (value) => {
				folderPath = value.trim();
			})
		)
		.addButton((button) =>
			button
				.setButtonText("Save folder")
				.setCta()
				.onClick(async () => {
					if (await onFolderChange(folderPath)) {
						await updateSettings((settings) => { settings.databaseFolderPath = folderPath; });
					}
				}),
		);

	new Setting(containerEl)
		.setName("Show hobby add button")
		.setDesc("Display an icon in the right panel to quickly open hobby actions.")
		.addToggle((toggle) => 
		toggle
			.setValue(settingsConfig.showAddButton)
			.onChange(async (value) => {
				await updateSettings((setting) => {setting.showAddButton = value; });
			})
		);

	new Setting(containerEl)
		.setName("Show quick hobbies ticker")
		.setDesc("Display the quick hobby ticker in the left panel.")
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
