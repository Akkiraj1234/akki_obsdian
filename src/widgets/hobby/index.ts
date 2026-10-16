import { Modal, type App, type Plugin } from 'obsidian';
import type { AkkiObsidianApp } from '@/core/app';
import type { WidgetDefinition } from '@/core/types';
import { renderHobbyManager } from './hobby_manager';
import { renderHobbyPlanner } from './hobby_planner';
import { renderHobbyTracker } from './hobby_tracker';
import { DEFAULT_HOBBY_SETTINGS, renderHobbySettings, type HobbySettings } from './settings';

type HobbyPane = 'tracker' | 'planner' | 'manager';

/** Owns the hobby window: tabs, lifecycle, and the ribbon entry point. */
class HobbyWindow extends Modal {
    private activePane: HobbyPane = 'tracker';

    constructor(app: App, private readonly hobbyApp: AkkiObsidianApp) { super(app); }

    onOpen(): void {
        this.contentEl.addClass('akki-hobby-window');
        this.renderShell();
    }

    onClose(): void { this.contentEl.empty(); }

    private renderShell(): void {
        const { contentEl } = this;
        contentEl.empty();
        const header = contentEl.createDiv({ cls: 'akki-hobby-window-header' });
        header.createEl('h2', { text: 'Hobbies' });
        const tabs = header.createDiv({ cls: 'akki-hobby-tabs' });
        this.createTab(tabs, 'tracker', 'Tracker');
        this.createTab(tabs, 'planner', 'Planner');
        this.createTab(tabs, 'manager', 'Manager');
        const panel = contentEl.createDiv({ cls: 'akki-hobby-panel' });
        void this.renderPane(panel);
    }

    private createTab(parent: HTMLElement, pane: HobbyPane, label: string): void {
        const tab = parent.createEl('button', {
            text: label,
            cls: pane === this.activePane ? 'is-active' : '',
        });
        tab.addEventListener('click', () => {
            this.activePane = pane;
            this.renderShell();
        });
    }

    private async renderPane(panel: HTMLElement): Promise<void> {
        const db = this.hobbyApp.get_markdb();
        if (this.activePane === 'tracker') await renderHobbyTracker(panel, db);
        else if (this.activePane === 'planner') await renderHobbyPlanner(panel, db);
        else await renderHobbyManager(panel, db, {
            onHobbiesChanged: async () => this.refreshActivePane(),
        });
    }

    private async refreshActivePane(): Promise<void> {
        const panel = this.contentEl.querySelector<HTMLElement>('.akki-hobby-panel');
        if (panel) await this.renderPane(panel);
    }
}

class HobbyWidget {
    private ribbonIcon?: HTMLElement;

    constructor(
        private readonly plugin: Plugin,
        private readonly app: AkkiObsidianApp,
        private readonly settings: HobbySettings,
    ) {}

    async on_load(): Promise<void> {
        await this.app.get_markdb().ensureYearFiles(new Date().getFullYear());
        this.initializeWorkspace();
    }

    async on_unload(): Promise<void> { this.uninitializeWorkspace(); }

    async on_settings_changed(): Promise<void> {
        this.uninitializeWorkspace();
        this.initializeWorkspace();
    }

    private initializeWorkspace(): void {
        if (!this.settings.showRibbonIcon) return;
        this.ribbonIcon = this.plugin.addRibbonIcon('list-checks', 'Open hobby dashboard', () => this.openWindow());
    }

    private uninitializeWorkspace(): void {
        this.ribbonIcon?.remove();
        this.ribbonIcon = undefined;
    }

    private openWindow(): void { new HobbyWindow(this.plugin.app, this.app).open(); }
}

export const hobbyWidget: WidgetDefinition<HobbySettings> = {
    id: 'hobby',
    defaultSettings: DEFAULT_HOBBY_SETTINGS,
    create: (context) => new HobbyWidget(context.plugin, context.app, context.settings),
    renderSettings: renderHobbySettings,
};
