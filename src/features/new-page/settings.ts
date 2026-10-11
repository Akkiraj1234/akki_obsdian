import { Setting } from "obsidian";
import type { FeatureContext } from "../../core/feature";
import type { NewPageSettings } from "./types";

export function renderNewPageSettings(containerEl: HTMLElement, context: FeatureContext<NewPageSettings>): void {
	new Setting(containerEl).setName("Enable new-page interface").setDesc("Enable the custom page interface.").addToggle((toggle) =>
		toggle.setValue(context.settingsConfig.enabled).onChange(async (value) => {
			await context.updateSettings((settings) => { settings.enabled = value; });
		}),
	);
}
