import type { WidgetSettings } from '@/core/types';

export interface GitHubActivitySettings extends WidgetSettings {
    username: string;
    openInNewTab: boolean;
}

export interface GitHubEvent {
    id: string;
    type: string;
    repo: { name: string };
    created_at: string;
    payload: { commits?: Array<unknown>; action?: string; ref?: string };
}

export interface ActivityItem {
    title: string;
    repo: string;
    date: Date;
    kind: 'push' | 'pull-request' | 'issue' | 'star' | 'repository' | 'other';
}
