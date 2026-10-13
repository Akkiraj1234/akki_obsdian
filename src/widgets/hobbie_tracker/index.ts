import { Notice, type Plugin } from 'obsidian';
import { AkkiObsidianApp } from '@/core/app';
import { DEFAULT_SETTINGS } from './settings';
import { renderHobbieTrackerSettings } from './settings';
import type { WidgetDefinition } from '@/core/types';
import type { HobbieTrackerSettings } from './types';



/**
 * Manages the Hobby Tracker widget and its workspace integration.
 *
 * Controls the ribbon icon according to the widget's settings and
 * handles workspace initialization, cleanup, and settings changes.
 */
class HobbieTracker {
    private ribbonIcon?: HTMLElement;

    /**
     * Creates the widget with its required dependencies and configuration.
     *
     * @param plugin - The Obsidian plugin instance used to register UI elements.
     * @param app - The application coordinator managing the widget.
     * @param settings - The widget's current configuration.
     */
    constructor(
        private plugin: Plugin,
        private app: AkkiObsidianApp,
        private settings: HobbieTrackerSettings,
    ) {}

    /**
     * Initializes the widget when it is loaded.
     *
     * Sets up the workspace controls enabled by the current settings.
     */
    async on_load(): Promise<void> {
        this.initialize_workspace();
    }

    /**
     * Cleans up the widget before it is unloaded.
     *
     * Removes workspace controls owned by this widget.
     */
    async on_unload(): Promise<void> {
        this.uninitialize_workspace();
    }

    /**
     * Applies updated settings to the workspace.
     *
     * Removes existing controls and recreates them so that the workspace
     * reflects the widget's latest configuration.
     */
    async on_settings_changed(): Promise<void> {
        this.uninitialize_workspace();
        this.initialize_workspace();
    }

    /**
     * Registers the Hobby Tracker ribbon icon when enabled.
     *
     * Does nothing if the user has disabled the ribbon icon in settings.
     */
    private initialize_workspace(): void {
        if (!this.settings.showRibbonIcon) return;

        this.ribbonIcon = this.plugin.addRibbonIcon(
            'list-checks',
            'Hobbie Tracker',
            () => this.onRibbonIconClick(),
        );
    }

    /**
     * Removes the ribbon icon and clears its stored reference.
     *
     * Safe to call when no ribbon icon has been created.
     */
    private uninitialize_workspace(): void {
        this.ribbonIcon?.remove();
        this.ribbonIcon = undefined;
    }
    
    /**
     * Handles clicks on the Hobby Tracker ribbon icon.
     *
     * Currently displays a notice confirming that the icon was clicked.
     */
    private onRibbonIconClick(): void {
        new Notice('Hobbie Tracker: Ribbon icon clicked');
    }
}


/**
 * Registers the Hobby Tracker widget with the plugin's widget system.
 *
 * Supplies its unique ID, default settings, runtime factory, and settings
 * renderer so the application coordinator can create and manage the widget.
 */
const hobbieTrackerWidget: WidgetDefinition = {
    id: 'hobbie-tracker',
    defaultSettings: DEFAULT_SETTINGS,

    create: (context) =>
        new HobbieTracker(
            context.plugin,
            context.app,
            context.settings as HobbieTrackerSettings,
        ),
    
    renderSettings: renderHobbieTrackerSettings,
};

export { hobbieTrackerWidget };
