
import { Setting } from "obsidian";
import type AkkiObsidianPlugin from "../../main";

export function renderNewPageSettings(
	containerEl: HTMLElement,
	plugin: AkkiObsidianPlugin,
): void {
	new Setting(containerEl)
		.setName("Enable new-page interface")
		.setDesc("Enable the custom page interface.")
		.addToggle((toggle) =>
			toggle
				.setValue(plugin.settings.newPageInterface.enabled)
				.onChange(async (value) => {
					plugin.settings.newPageInterface.enabled = value;
					await plugin.saveSettings();
				}),
		);
}
