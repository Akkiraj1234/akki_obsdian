import { Plugin } from 'obsidian';
import { AkkiObsidianApp } from './core/app';
import { AkkiObsidianSettingTab } from './core/settings_tab';


/**
 * Main entry point for the Akki Obsidian plugin.
 *
 * Bridges Obsidian's plugin lifecycle with the application coordinator.
 * Delegates settings persistence, MarkDB operations, and widget lifecycle
 * management to AkkiObsidianApp, keeping the entry point focused on
 * startup and shutdown orchestration.
 */
export default class AkkiObsidianPlugin extends Plugin {
    private pluginApp!: AkkiObsidianApp;

    /**
     * Initializes the plugin when Obsidian loads or enables it.
     *
     * Creates the application coordinator, restores persisted settings,
     * loads MarkDB data, initializes registered widgets, and registers
     * the plugin's settings page.
     *
     * @returns A promise that resolves when plugin initialization completes.
     */
    async onload(): Promise<void> {
        this.pluginApp = new AkkiObsidianApp(this);

        await this.pluginApp.load_settings();
        await this.pluginApp.load_markdb();
        await this.pluginApp.load_widgets();

        this.addSettingTab(
            new AkkiObsidianSettingTab(
                this.app,
                this,
                this.pluginApp,
            ),
        );
    }
    
    /**
     * Shuts down the plugin when Obsidian unloads or disables it.
     *
     * Saves the current settings and MarkDB data, then unloads registered
     * widgets so they can release their resources and remove their
     * workspace integrations.
     *
     * @returns A promise that resolves when the shutdown operations complete.
     */
    onunload(): void {
        void this.shutdown();
    }

    private async shutdown(): Promise<void> {
        await this.pluginApp.save_settings();
        await this.pluginApp.save_markdb();
        await this.pluginApp.unload_widgets();
    }
}
