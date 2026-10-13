import type { Plugin } from 'obsidian';
import type { AkkiObsidianApp } from './app';


/**
 * Represents the configuration data owned by an individual widget.
 *
 * Settings are stored as key-value pairs and persisted as part of the
 * plugin's root settings object. Each widget maintains its own settings
 * under its unique widget ID, keeping its configuration separate from
 * that of other widgets.
 *
 * Concrete widget settings types should extend this structure to define
 * the specific configuration options supported by each widget.
 */
export type WidgetSettings = Record<string, unknown>;

/**
 * Describes the dependencies and configuration provided to a widget
 * when its runtime instance is created.
 *
 * The context gives a widget access to the active Obsidian plugin,
 * the application coordinator, and its own settings object.
 *
 * The settings object contains the widget's current configuration and
 * can be used by the widget during initialization and normal operation.
 *
 * @typeParam TSettings - The concrete settings type used by the widget.
 * Defaults to the general widget settings structure when no specific
 * settings type is supplied.
 */
export interface WidgetContext<TSettings extends WidgetSettings = WidgetSettings> {
    plugin: Plugin;
    app: AkkiObsidianApp;
    settings: TSettings;
}

/**
 * Provides the settings interface and update mechanism exposed to a widget's
 * settings renderer.
 *
 * The context gives the widget access to its current settings and a callback
 * for applying configuration changes. Updates are handled asynchronously
 * so the application can persist the modified settings and notify the
 * corresponding widget when its configuration changes.
 *
 * @typeParam TSettings - The concrete settings type associated with the widget.
 * Defaults to the general widget settings structure.
 */
export interface WidgetSettingsContext<TSettings extends WidgetSettings = WidgetSettings> {
    settings: TSettings;
    updateSettings(
        updater: (settings: TSettings) => void,
    ): Promise<void>;
}

/**
 * Defines the runtime lifecycle contract for an instantiated widget.
 *
 * A widget implements this interface to initialize its functionality and,
 * optionally, release resources or respond to configuration changes.
 *
 * The application coordinator invokes these hooks to manage widget
 * instances without needing to know their concrete implementations.
 */
export interface WidgetApp {
    on_load(): void | Promise<void>;
    on_unload?(): void | Promise<void>;
    on_settings_changed?(): void | Promise<void>;
}

/**
 * Describes a widget's registration metadata, default configuration,
 * runtime factory, and optional settings renderer.
 *
 * A definition acts as the blueprint used by the application coordinator
 * to create and manage a widget. It separates the widget's registration
 * information from its runtime implementation.
 *
 * Each definition supplies a unique ID, the widget's default settings,
 * and a factory that creates its runtime instance. It may also provide
 * a settings renderer that contributes configuration controls to the
 * plugin's settings page.
 *
 * @typeParam TSettings - The concrete settings type owned by this widget.
 * Defaults to the general widget settings structure.
 */
export interface WidgetDefinition<TSettings extends WidgetSettings = WidgetSettings> {
    id: string;
    defaultSettings: TSettings;

    create(context: WidgetContext<TSettings>): WidgetApp;

    renderSettings?(
        containerEl: HTMLElement,
        context: WidgetSettingsContext<TSettings>,
    ): void;
}

/**
 * Defines the root settings structure persisted by the plugin.
 *
 * Widget configurations are stored in a record keyed by each widget's
 * unique ID. This allows the application coordinator to load, update,
 * and save settings for multiple widgets within a single root object.
 *
 * Each widget owns its own entry, preventing settings from different
 * widgets from sharing the same configuration namespace.
 */
export interface RootSettings {
    widgets: Record<string, WidgetSettings>;
}
