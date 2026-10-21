import { ItemView, Modal, type App, type Plugin, type WorkspaceLeaf } from 'obsidian';
import type { AkkiObsidianApp } from '@/core/app';
import type { WidgetDefinition } from '@/core/types';
import { renderHobbyManager } from './hobby_manager';
import { renderHobbyPlanner } from './hobby_planner';
import { renderHobbyTracker } from './hobby_tracker';
import { DEFAULT_HOBBY_SETTINGS, renderHobbySettings, type HobbySettings } from './settings';

type HobbyPane = 'tracker' | 'planner' | 'manager';
const HOBBY_MANAGER_VIEW = 'akki-hobby-manager';

class HobbyManagerView extends ItemView {
    constructor(leaf: WorkspaceLeaf, private readonly hobbyApp: AkkiObsidianApp) { super(leaf); }
    getViewType(): string { return HOBBY_MANAGER_VIEW; }
    getDisplayText(): string { return 'Hobby manager'; }
    getIcon(): string { return 'list-checks'; }
    async onOpen(): Promise<void> {
        await renderHobbyManager(this.contentEl, this.hobbyApp.get_markdb());
    }
}

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
        else await renderHobbyManager(panel, db);
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
        this.plugin.registerView(HOBBY_MANAGER_VIEW, (leaf) => new HobbyManagerView(leaf, this.app));
        this.plugin.registerMarkdownCodeBlockProcessor('hobby-manager', (_source, container) => {
            void renderHobbyManager(container, this.app.get_markdb());
        });
        this.plugin.registerMarkdownCodeBlockProcessor('hobby-manger', (_source, container) => {
            void renderHobbyManager(container, this.app.get_markdb());
        });
        this.initializeWorkspace();
        this.plugin.app.workspace.onLayoutReady(() => void this.openSidebar());
    }

    async on_unload(): Promise<void> {
        this.uninitializeWorkspace();
        this.plugin.app.workspace.detachLeavesOfType(HOBBY_MANAGER_VIEW);
    }

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

    private async openSidebar(): Promise<void> {
        const existing = this.plugin.app.workspace.getLeavesOfType(HOBBY_MANAGER_VIEW)[0];
        const leaf = existing ?? this.plugin.app.workspace.getRightLeaf(false);
        if (!leaf) return;
        if (!existing) await leaf.setViewState({ type: HOBBY_MANAGER_VIEW, active: true });
        await this.plugin.app.workspace.revealLeaf(leaf);
    }
}

export const hobbyWidget: WidgetDefinition<HobbySettings> = {
    id: 'hobby',
    defaultSettings: DEFAULT_HOBBY_SETTINGS,
    create: (context) => new HobbyWidget(context.plugin, context.app, context.settings),
    renderSettings: renderHobbySettings,
};
