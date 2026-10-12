import {Plugin} from 'obsidian';
import {AkkiObsidianApp} from './core/app';


export default class AkkiObsidianPlugin extends Plugin {
    private PluginApp!: AkkiObsidianApp;

    async onload(): Promise<void> {
        this.PluginApp = new AkkiObsidianApp(this);
        await this.PluginApp.on_load();
    }

    async onunload(): Promise<void> {
        this.PluginApp.on_unload();
    }
}