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

/**
 * Central application coordinator for Akki Obsidian.
 *
 * Manages the lifecycle of registered widgets, handles settings persistence,
 * and provides a shared application context for widgets to interact with
 * the plugin and access their configuration.
 *
 * Responsibilities:
 * - Load saved settings and merge them with registered widget defaults.
 * - Persist the current application settings through Obsidian's data API.
 * - Create and initialize registered widgets.
 * - Unload widgets and release their resources.
 * - Provide widget-specific settings contexts for reading and updating
 *   configuration.
 *
 * This class acts as the coordination layer between the Obsidian plugin
 * entry point and individual widget implementations. Widgets are created
 * from their definitions in the widget registry, allowing the application
 * to manage them without depending on their concrete implementations.
 */
class AkkiObsidianApp {
    private settings: RootSettings = { widgets: {} };
    private widgets = new Map<string, WidgetApp>();
    private settingsLoaded = false;

    /**
     * Creates the application coordinator and connects it to Obsidian.
     *
     * Retains the plugin instance so the application can access Obsidian's
     * plugin data storage and expose the plugin API to widget contexts.
     *
     * @param plugin - The active Obsidian plugin instance that owns this
     * application coordinator.
     */
    constructor(private readonly plugin: Plugin) {}

    /**
     * Loads saved plugin data and merges each registered widget's saved
     * settings with its defaults.
     *
     * Missing or invalid widget settings fall back to their defaults.
     * Marks settings as loaded once initialization is complete.
     */
    async load_settings(): Promise<void> {
        const data: unknown = await this.plugin.loadData();

        const isRecord = (
            value: unknown,
        ): value is Record<string, unknown> => {
            return (
                typeof value === 'object' &&
                value !== null &&
                !Array.isArray(value)
            );
        };

        const savedWidgets =
            isRecord(data) && isRecord(data.widgets)
                ? data.widgets
                : {}; 

        const widgets: Record<string, WidgetSettings> = {};

        for (const definition of WIDGETS) {
            const saved = savedWidgets[definition.id];

            widgets[definition.id] = {
                ...definition.defaultSettings,
                ...(isRecord(saved) ? saved : {}),
            };
        }

        this.settings = { widgets };
        this.settingsLoaded = true;
    }

    /**
     * Persists the current root settings, including all widget settings,
     * using Obsidian's plugin data storage.
     */
    async save_settings(): Promise<void> {
        await this.plugin.saveData(this.settings);
    }

    /**
     * Loads the application's MarkDB data.
     *
     * Reserved for the future MarkDB integration. The loading behavior,
     * storage format, and initialization requirements have not yet been
     * implemented.
     *
     * @returns A promise that currently resolves without loading any data.
     */
    async load_markdb(): Promise<void> {
        if (this.settingsLoaded && typeof this.settings === 'object') {
            
        }
    }

    /**
     * Persists the application's MarkDB data.
     *
     * Reserved for the future MarkDB integration. The persistence mechanism
     * and the data that should be saved have not yet been implemented.
     *
     * @returns A promise that currently resolves without saving any data.
     */
    async save_markdb(): Promise<void> {
        
    }

    /**
     * Creates and initializes all registered widgets.
     *
     * Ensures settings are loaded before widget creation and skips
     * initialization if widgets have already been loaded.
     */
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

    /**
     * Unloads initialized widgets in reverse order and clears the registry.
     *
     * Calls each widget's optional unload hook before removing it.
     */
    async unload_widgets(): Promise<void> {
        for (const widget of [...this.widgets.values()].reverse()) {
            await widget.on_unload?.();
        }

        this.widgets.clear();
    }

    /**
     * Creates a context for accessing and updating a widget's settings.
     *
     * Provides the widget's current settings and an update function that
     * applies changes, persists them, and invokes the widget's optional
     * settings-change hook.
     *
     * @param definition - Definition identifying the widget and its settings type.
     * @returns A context containing the widget's settings and update function.
     */
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