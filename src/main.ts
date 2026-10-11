import { Plugin } from 'obsidian';
import {
	AkkiObsidianSettingTab,
	AkkiObsidianSettings,
	DEFAULT_SETTINGS,
} from './settings';


class AkkiObsidianPlugin extends Plugin {
	settings!: AkkiObsidianSettings;

	async onload() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<AkkiObsidianSettings>,
		);

		this.addSettingTab(
			new AkkiObsidianSettingTab(this.app, this),
		)
	}

	async loadSettings() {
		// to load setting
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
	
	onunload() {
		// what to do when unload
	}

	onResize() {
		// what to do on resize
	}
	
}

export default AkkiObsidianPlugin
