import { setIcon } from 'obsidian';
import { fetchGitHubActivity } from './api';
import type { ActivityItem, GitHubActivitySettings } from './types';

export interface GitHubActivityActions {
    createBlankPage(): Promise<void>;
    createNote(): Promise<void>;
}

/** Renders a compact GitHub dashboard in either an Obsidian tab or a modal. */
export async function renderGitHubActivity(
    containerEl: HTMLElement,
    settings: GitHubActivitySettings,
    actions: GitHubActivityActions,
): Promise<void> {
    containerEl.empty();
    containerEl.addClass('akki-github-activity');
    const header = containerEl.createDiv({ cls: 'akki-github-header' });
    const mark = header.createDiv({ cls: 'akki-github-mark' });
    setIcon(mark, 'github');
    const title = header.createDiv({ cls: 'akki-github-title' });
    title.createEl('h2', { text: 'GitHub activity' });
    title.createEl('p', { text: settings.username ? `@${settings.username} · public activity` : 'Choose a GitHub username in settings.' });
    const refresh = header.createEl('button', { text: 'Refresh', cls: 'mod-cta' });
    refresh.addEventListener('click', () => void renderGitHubActivity(containerEl, settings, actions));

    const feed = containerEl.createDiv({ cls: 'akki-github-feed' });
    if (!settings.username) {
        refresh.hide();
        feed.createDiv({ text: 'Add a username in plugin settings to see your activity here.', cls: 'akki-github-empty' });
    } else {
        const loading = feed.createDiv({ text: 'Loading public activity…', cls: 'setting-item-description' });
        try {
            const activity = await fetchGitHubActivity(settings.username);
            loading.remove();
            renderActivityList(feed, activity);
        } catch (error) {
            loading.setText(error instanceof Error ? error.message : 'Unable to load GitHub activity.');
            loading.addClass('mod-warning');
        }
    }
    renderActions(containerEl, actions);
}

function renderActivityList(parent: HTMLElement, activity: ActivityItem[]): void {
    if (activity.length === 0) {
        parent.createDiv({ text: 'No recent public activity was found.', cls: 'akki-github-empty' });
        return;
    }
    const summary = parent.createDiv({ cls: 'akki-github-summary' });
    summary.createSpan({ text: `${activity.length} recent events` });
    summary.createSpan({ text: `${new Set(activity.map((item) => item.repo)).size} repositories` });
    const list = parent.createDiv({ cls: 'akki-github-list' });
    for (const item of activity) {
        const row = list.createDiv({ cls: 'akki-github-row' });
        const icon = row.createDiv({ cls: `akki-github-icon is-${item.kind}` });
        setIcon(icon, iconFor(item.kind));
        const details = row.createDiv({ cls: 'akki-github-details' });
        details.createEl('strong', { text: item.title });
        details.createEl('a', { text: item.repo, href: `https://github.com/${item.repo}` });
        row.createEl('time', { text: relativeTime(item.date), cls: 'akki-github-time' });
    }
}

function renderActions(parent: HTMLElement, actions: GitHubActivityActions): void {
    const section = parent.createDiv({ cls: 'akki-github-actions' });
    section.createEl('p', { text: 'What would you like to do next?', cls: 'akki-github-actions-title' });
    const cards = section.createDiv({ cls: 'akki-github-action-cards' });
    createAction(cards, 'file-plus-2', 'Create a note', 'Open a new note to start writing.', () => actions.createNote());
    createAction(cards, 'panel-top', 'Blank page', 'Switch this tab back to an empty page.', () => actions.createBlankPage());
}

function createAction(parent: HTMLElement, iconName: string, title: string, description: string, action: () => Promise<void>): void {
    const button = parent.createEl('button', { cls: 'akki-github-action-card' });
    const icon = button.createSpan({ cls: 'akki-github-action-icon' });
    setIcon(icon, iconName);
    const copy = button.createSpan();
    copy.createEl('strong', { text: title });
    copy.createEl('small', { text: description });
    button.addEventListener('click', () => void action());
}

function iconFor(kind: ActivityItem['kind']): string {
    if (kind === 'push') return 'git-commit-horizontal';
    if (kind === 'pull-request') return 'git-pull-request';
    if (kind === 'issue') return 'circle-dot';
    if (kind === 'star') return 'star';
    return 'plus';
}

function relativeTime(date: Date): string {
    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86_400)}d ago`;
}
