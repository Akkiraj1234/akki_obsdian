import { ItemView, Modal, type Plugin, type WorkspaceLeaf } from 'obsidian';
import type { WidgetDefinition } from '@/core/types';
import { renderGitHubActivity, type GitHubActivityActions } from './render';
import { DEFAULT_GITHUB_ACTIVITY_SETTINGS, renderGitHubActivitySettings } from './settings';
import type { GitHubActivitySettings } from './types';

const VIEW_TYPE_GITHUB_ACTIVITY = 'akki-github-activity';

class GitHubActivityView extends ItemView {
    constructor(
        leaf: WorkspaceLeaf,
        private readonly getSettings: () => GitHubActivitySettings,
        private readonly actions: GitHubActivityActions,
    ) { super(leaf); }
    getViewType(): string { return VIEW_TYPE_GITHUB_ACTIVITY; }
    getDisplayText(): string { return 'GitHub activity'; }
    getIcon(): string { return 'github'; }
    async onOpen(): Promise<void> { await renderGitHubActivity(this.contentEl, this.getSettings(), this.actions); }
}

class GitHubActivityModal extends Modal {
    constructor(
        private readonly settings: GitHubActivitySettings,
        private readonly actions: GitHubActivityActions,
        plugin: Plugin,
    ) { super(plugin.app); }
    onOpen(): void {
        void renderGitHubActivity(this.contentEl, this.settings, {
            createBlankPage: async () => { this.close(); await this.actions.createBlankPage(); },
            createNote: async () => { this.close(); await this.actions.createNote(); },
        });
    }
    onClose(): void { this.contentEl.empty(); }
}

class GitHubActivityWidget {
    private readonly pendingEmptyLeaves = new Set<WorkspaceLeaf>();
    private readonly allowedEmptyLeaves = new WeakSet<WorkspaceLeaf>();

    constructor(private readonly plugin: Plugin, private readonly settings: GitHubActivitySettings) {}

    on_load(): void {
        this.plugin.registerView(VIEW_TYPE_GITHUB_ACTIVITY, (leaf) => new GitHubActivityView(
            leaf,
            () => this.settings,
            {
                createBlankPage: async () => this.createBlankPage(leaf),
                createNote: async () => this.createNote(),
            },
        ));
        this.plugin.addCommand({
            id: 'open-github-activity',
            name: 'Open GitHub activity',
            callback: () => void this.openActivity(),
        });
        this.plugin.registerEvent(this.plugin.app.workspace.on('layout-change', () => void this.showInNewTabs()));
        this.plugin.registerEvent(this.plugin.app.workspace.on('active-leaf-change', () => void this.showInNewTabs()));
        this.plugin.app.workspace.onLayoutReady(() => {
            if (this.settings.openInNewTab) void this.showInNewTabs();
        });
    }

    on_settings_changed(): void {
        if (this.settings.openInNewTab) void this.openActivity();
    }

    async on_unload(): Promise<void> {
        this.plugin.app.workspace.detachLeavesOfType(VIEW_TYPE_GITHUB_ACTIVITY);
    }

    private async openActivity(): Promise<void> {
        if (!this.settings.openInNewTab) {
            new GitHubActivityModal(this.settings, {
                createBlankPage: async () => this.createBlankPage(),
                createNote: async () => this.createNote(),
            }, this.plugin).open();
            return;
        }
        const existingLeaf = this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_GITHUB_ACTIVITY)[0];
        if (existingLeaf) {
            void this.plugin.app.workspace.revealLeaf(existingLeaf);
            return;
        }
        const leaf = this.plugin.app.workspace.getLeaf('tab');
        await leaf.setViewState({ type: VIEW_TYPE_GITHUB_ACTIVITY, active: true });
        void this.plugin.app.workspace.revealLeaf(leaf);
    }

    private async createBlankPage(leaf?: WorkspaceLeaf): Promise<void> {
        const targetLeaf = leaf ?? this.plugin.app.workspace.getLeaf('tab');
        this.allowedEmptyLeaves.add(targetLeaf);
        await targetLeaf.setViewState({ type: 'empty', active: true });
        void this.plugin.app.workspace.revealLeaf(targetLeaf);
    }

    private async createNote(): Promise<void> {
        const sourcePath = this.plugin.app.workspace.getActiveFile()?.path ?? '';
        const parent = this.plugin.app.fileManager.getNewFileParent(sourcePath, 'Untitled.md');
        const basePath = parent.path ? `${parent.path}/Untitled` : 'Untitled';
        let path = `${basePath}.md`;
        let number = 1;
        while (this.plugin.app.vault.getAbstractFileByPath(path)) {
            number += 1;
            path = `${basePath} ${number}.md`;
        }
        const file = await this.plugin.app.vault.create(path, '');
        const leaf = this.plugin.app.workspace.getLeaf('tab');
        this.allowedEmptyLeaves.add(leaf);
        await leaf.openFile(file, { active: true });
        void this.plugin.app.workspace.revealLeaf(leaf);
    }

    /** Replaces only Obsidian's blank new-tab leaves, never notes or other views. */
    private async showInNewTabs(): Promise<void> {
        if (!this.settings.openInNewTab) return;
        const emptyLeaves = this.plugin.app.workspace.getLeavesOfType('empty');
        for (const leaf of emptyLeaves) {
            if (this.pendingEmptyLeaves.has(leaf) || this.allowedEmptyLeaves.has(leaf)) continue;
            this.pendingEmptyLeaves.add(leaf);
            try {
                await leaf.setViewState({ type: VIEW_TYPE_GITHUB_ACTIVITY, active: true });
            } finally {
                this.pendingEmptyLeaves.delete(leaf);
            }
        }
    }
}

export const githubActivityWidget: WidgetDefinition<GitHubActivitySettings> = {
    id: 'github-activity',
    defaultSettings: DEFAULT_GITHUB_ACTIVITY_SETTINGS,
    create: (context) => new GitHubActivityWidget(context.plugin, context.settings),
    renderSettings: renderGitHubActivitySettings,
};
