import type { Plugin } from 'obsidian';

import { WIDGETS } from '@/widgets';

import type {
    WidgetApp,
    WidgetContext,
    WidgetDefinition,
    WidgetSettings,
    WidgetSettingsContext,
    RootSettings,
} from './types';

class AkkiObsidianApp {
    private settings: RootSettings = { widgets: {} };
    private widgets = new Map<string, WidgetApp>();
    private settingsLoaded = false;

    constructor(private readonly plugin: Plugin) {}

    async load_settings(): Promise<void> {
        const data: unknown = await this.plugin.loadData();

        const savedWidgets =
            typeof data === 'object' &&
            data !== null &&
            'widgets' in data &&
            typeof data.widgets === 'object' &&
            data.widgets !== null &&
            !Array.isArray(data.widgets)
                ? data.widgets as Record<string, unknown>
                : {};

        const widgets: Record<string, WidgetSettings> = {};

        for (const definition of WIDGETS) {
            const saved = savedWidgets[definition.id];

            widgets[definition.id] = {
                ...definition.defaultSettings,
                ...(typeof saved === 'object' &&
                saved !== null &&
                !Array.isArray(saved)
                    ? saved
                    : {}),
            };
        }

        this.settings = { widgets };
        this.settingsLoaded = true;
    }

    async save_settings(): Promise<void> {
        await this.plugin.saveData(this.settings);
    }

    async load_widgets(): Promise<void> {
        if (!this.settingsLoaded) {
            await this.load_settings();
        }

        if (this.widgets.size > 0) {
            return;
        }

        for (const definition of WIDGETS) {
            const context: WidgetContext = {
                plugin: this.plugin,
                app: this,
                settings: this.settings.widgets[definition.id]!,
            };

            const widget = definition.create(context);

            this.widgets.set(definition.id, widget);
            await widget.on_load();
        }
    }

    async unload_widgets(): Promise<void> {
        for (const widget of [...this.widgets.values()].reverse()) {
            await widget.on_unload?.();
        }

        this.widgets.clear();
    }

    get_widget_settings_context<TSettings extends WidgetSettings>(
        definition: WidgetDefinition<TSettings>,
    ): WidgetSettingsContext<TSettings> {
        return {
            settings: this.settings.widgets[definition.id] as TSettings,

            updateSettings: async (updater) => {
                const settings = this.settings.widgets[definition.id] as TSettings;

                updater(settings);

                await this.save_settings();
                await this.widgets
                    .get(definition.id)
                    ?.on_settings_changed?.();
            },
        };
    }
}

export default AkkiObsidianApp;
export { AkkiObsidianApp };
