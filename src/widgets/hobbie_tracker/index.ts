import { Notice, type Plugin } from 'obsidian';
import { AkkiObsidianApp } from '@/core/app';
import { DEFAULT_SETTINGS } from './settings';
import { renderHobbieTrackerSettings } from './settings';
import type { WidgetDefinition } from '@/core/types';
import type { HobbieTrackerSettings } from './types';


class HobbieTracker {
    private ribbonIcon?: HTMLElement;

    constructor(
        private plugin: Plugin,
        private app: AkkiObsidianApp,
        private settings: HobbieTrackerSettings,
    ) {}

    async on_load(): Promise<void> {
        this.initialize_workspace();
    }

    async on_unload(): Promise<void> {
        this.uninitialize_workspace();
    }

    async on_settings_changed(): Promise<void> {
        this.uninitialize_workspace();
        this.initialize_workspace();
    }

    /*
    * initialize the workspace by adding the ribbon icon if the setting is enabled
    * and setting up any other necessary UI elements or event listeners
    */
    private initialize_workspace(): void {
        if (!this.settings.showRibbonIcon) return;

        this.ribbonIcon = this.plugin.addRibbonIcon(
            'list-checks',
            'Hobbie Tracker',
            () => this.onRibbonIconClick(),
        );
    }

    private uninitialize_workspace(): void {
        this.ribbonIcon?.remove();
        this.ribbonIcon = undefined;
    }
    
    private onRibbonIconClick(): void {
        new Notice('Hobbie Tracker: Ribbon icon clicked');
    }
}


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
