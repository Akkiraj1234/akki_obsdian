import { App, PluginSettingTab, Setting } from 'obsidian';
import type AkkiObsidianPlugin from './main';

export interface AkkiObsidianSettings {
	showCompletedTasks: boolean;
}

export const DEFAULT_SETTINGS: AkkiObsidianSettings = {
	showCompletedTasks: false,
};

export class AkkiObsidianSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: AkkiObsidianPlugin,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Show completed tasks')
			.setDesc('Include completed tasks when task features are displayed.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showCompletedTasks)
					.onChange(async (value) => {
						this.plugin.settings.showCompletedTasks = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
