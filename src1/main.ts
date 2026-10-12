import { Plugin } from 'obsidian';
import { AkkiObsidianSettingTab } from './settings/settings-tab';
import { features } from './core/load_features';
import { AkkiObsidianApp } from './core/app';


export default class AkkiObsidianPlugin extends Plugin {
	private pluginApp!: AkkiObsidianApp;

	async onload(): Promise<void> {
		// setup the plugin app
		this.pluginApp =  new AkkiObsidianApp(this, features);
		await this.pluginApp.on_load();
		
		// setup the setting tab
		this.addSettingTab(
			new AkkiObsidianSettingTab(
				this.app, 
				this.pluginApp
			)
		);
	}

	async onunload(): Promise<void> {
		this.pluginApp.on_unload();
	}
}

