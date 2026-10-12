import type { Plugin } from 'obsidian';
import type { AkkiObsidianApp } from './app';

export type WidgetSettings = Record<string, unknown>;

export interface WidgetContext<TSettings extends WidgetSettings = WidgetSettings> {
    plugin: Plugin;
    app: AkkiObsidianApp;
    settings: TSettings;
}

export interface WidgetSettingsContext<TSettings extends WidgetSettings = WidgetSettings> {
    settings: TSettings;
    updateSettings(
        updater: (settings: TSettings) => void,
    ): Promise<void>;
}

export interface WidgetApp {
    on_load(): void | Promise<void>;
    on_unload?(): void | Promise<void>;
    on_settings_changed?(): void | Promise<void>;
}

export interface WidgetDefinition<TSettings extends WidgetSettings = WidgetSettings> {
    id: string;
    defaultSettings: TSettings;

    create(context: WidgetContext<TSettings>): WidgetApp;

    renderSettings?(
        containerEl: HTMLElement,
        context: WidgetSettingsContext<TSettings>,
    ): void;
}

export interface RootSettings {
    widgets: Record<string, WidgetSettings>;
}
