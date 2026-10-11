import { Plugin } from 'obsidian';
import { AkkiObsidianApp } from './core/app';
import { featureRegistry } from './core/registry';
import { AkkiObsidianSettingTab } from './settings/settings-tab';
import { DEFAULT_ROOT_SETTINGS } from './settings/types';


export default class AkkiObsidianPlugin extends Plugin {
	private pluginApp!: AkkiObsidianApp;

	async onload(): Promise<void> {
		this.pluginApp = new AkkiObsidianApp(this, DEFAULT_ROOT_SETTINGS, featureRegistry);
		await this.pluginApp.loadSettings();
		await this.pluginApp.initialize();
		this.addSettingTab(new AkkiObsidianSettingTab(this.app, this.pluginApp));
	}
}