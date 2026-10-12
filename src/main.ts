import { Plugin } from 'obsidian';

import { AkkiObsidianApp } from './core/app';
import { AkkiObsidianSettingTab } from './core/settings_tab';

export default class AkkiObsidianPlugin extends Plugin {
    private pluginApp!: AkkiObsidianApp;

    async onload(): Promise<void> {
        this.pluginApp = new AkkiObsidianApp(this);

        await this.pluginApp.load_settings();
        await this.pluginApp.load_widgets();

        this.addSettingTab(
            new AkkiObsidianSettingTab(
                this.app,
                this,
                this.pluginApp,
            ),
        );
    }

    async onunload(): Promise<void> {
        await this.pluginApp.unload_widgets();
    }
}