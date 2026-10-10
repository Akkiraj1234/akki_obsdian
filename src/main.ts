import { Notice, Plugin } from 'obsidian';
import {
	AkkiObsidianSettings,
	AkkiObsidianSettingTab,
	DEFAULT_SETTINGS,
} from './settings';

export default class AkkiObsidianPlugin extends Plugin {
	settings!: AkkiObsidianSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new AkkiObsidianSettingTab(this.app, this));

		this.addCommand({
			id: 'show-status',
			name: 'Show task plugin status',
			callback: () => new Notice('Akki Obsidian is ready.'),
		});
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<AkkiObsidianSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
