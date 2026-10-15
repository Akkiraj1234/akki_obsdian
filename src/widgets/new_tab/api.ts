import { requestUrl } from 'obsidian';
import type { ActivityItem, GitHubEvent } from './types';

const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i;

/** Fetches public GitHub events only when the user opens or refreshes the widget. */
export async function fetchGitHubActivity(username: string): Promise<ActivityItem[]> {
    const safeUsername = username.trim();
    if (!USERNAME_PATTERN.test(safeUsername)) throw new Error('Enter a valid GitHub username in settings.');
    const response = await requestUrl({
        url: `https://api.github.com/users/${encodeURIComponent(safeUsername)}/events?per_page=20`,
        headers: { Accept: 'application/vnd.github+json' },
    });
    if (response.status === 404) throw new Error('GitHub user not found.');
    if (response.status < 200 || response.status >= 300) {
        throw new Error(`GitHub could not load activity (${response.status}).`);
    }
    const data: unknown = response.json;
    if (!Array.isArray(data)) throw new Error('GitHub returned an unexpected activity response.');
    return data.filter(isGitHubEvent).map(toActivityItem).filter((item): item is ActivityItem => item !== null);
}

function isGitHubEvent(value: unknown): value is GitHubEvent {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const event = value as Record<string, unknown>;
    return typeof event.id === 'string' && typeof event.type === 'string'
        && typeof event.created_at === 'string' && typeof event.repo === 'object' && event.repo !== null
        && typeof (event.repo as Record<string, unknown>).name === 'string'
        && typeof event.payload === 'object' && event.payload !== null;
}

function toActivityItem(event: GitHubEvent): ActivityItem | null {
    const date = new Date(event.created_at);
    if (Number.isNaN(date.getTime())) return null;
    const repo = event.repo.name;
    if (event.type === 'PushEvent') {
        const commits = event.payload.commits?.length ?? 0;
        return { title: commits === 1 ? 'Pushed 1 commit' : `Pushed ${commits} commits`, repo, date, kind: 'push' };
    }
    if (event.type === 'PullRequestEvent') return { title: `${event.payload.action ?? 'Updated'} a pull request`, repo, date, kind: 'pull-request' };
    if (event.type === 'IssuesEvent') return { title: `${event.payload.action ?? 'Updated'} an issue`, repo, date, kind: 'issue' };
    if (event.type === 'WatchEvent') return { title: 'Starred a repository', repo, date, kind: 'star' };
    if (event.type === 'CreateEvent') return { title: `Created ${event.payload.ref ?? 'a repository resource'}`, repo, date, kind: 'repository' };
    return { title: event.type.replace(/Event$/, '').replace(/([a-z])([A-Z])/g, '$1 $2'), repo, date, kind: 'other' };
}
