import {
    PluginSettingTab,
    Setting,
    type App,
    type Plugin,
} from 'obsidian';

import { WIDGETS } from '@/widgets';
import type { AkkiObsidianApp } from '@/core/app';



/**
 * Provides the settings interface for the Akki Obsidian plugin.
 *
 * Builds a single settings page containing the plugin introduction,
 * navigation links to registered widgets, and the settings exposed by
 * each widget.
 *
 * Widget-specific settings are delegated to their respective definitions.
 * This keeps the settings tab independent of individual widget
 * implementations and allows new widgets to contribute their own settings
 * without requiring changes to this class.
 */
class AkkiObsidianSettingTab extends PluginSettingTab {
    /**
     * Creates the plugin settings tab.
     *
     * @param app - The Obsidian application instance used by the settings tab.
     * @param plugin - The Obsidian plugin instance associated with this tab.
     * @param pluginApp - The application coordinator responsible for widget
     * settings and their update contexts.
     */
    constructor(
        app: App,
        plugin: Plugin,
        private readonly pluginApp: AkkiObsidianApp,
    ) {
        super(app, plugin);
    }

    /**
     * Rebuilds the settings interface whenever Obsidian displays this tab.
     *
     * Clears the existing content, renders the plugin header and widget
     * navigation, and creates a settings section for each registered widget
     * that exposes a settings renderer.
     *
     * Each widget receives its own settings context from the application
     * coordinator, allowing it to read and update its configuration without
     * managing persistence directly.
     */
    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        this.renderHeader(containerEl);
        this.renderWidgetSettings(containerEl);
    }

    /**
     * Renders the plugin title and introductory description.
     *
     * Provides a consistent heading at the top of the settings page so users
     * can identify the plugin and understand its general purpose.
     *
     * @param containerEl - The root element of the settings page.
     */
    private renderHeader(containerEl: HTMLElement): void {
        const header = containerEl.createDiv({
            cls: 'setting-item akki-settings-header',
        });

        const headingInfo = header.createDiv({
            cls: 'setting-item-info akki-settings-heading-info',
        });

        headingInfo.createEl('p', {
            text: 'Akki Obsidian plugin',
            cls: 'setting-item-name',
        });

        headingInfo.createEl('p', {
            text: 'A collection of tools to manage life and integrate Obsidian into my daily workflow.',
            cls: 'setting-item-description',
        });
    }

    /**
     * Renders a navigation list containing links to registered widgets.
     *
     * Each link targets the corresponding widget settings section. Clicking
     * a link prevents the browser's default anchor behavior and smoothly
     * scrolls the settings container to the selected section.
     *
     * Widgets are included in the navigation even if they do not currently
     * expose a settings renderer.
     *
     * @param containerEl - The root element of the settings page.
     * @deprecated
     */
    private renderWidgetNavigation(containerEl: HTMLElement): void {
        const navigationInfo = containerEl.createDiv({
            cls: 'setting-item-info akki-settings-heading-items',
        });

        navigationInfo.createEl('p', {
            text: 'Explore widgets',
            cls: 'setting-item-name',
        });

        const navigation = navigationInfo.createEl('ol', {
            cls: 'akki-settings-navigation',
        });

        for (const widget of WIDGETS) {
            const sectionId = this.getWidgetSectionId(widget.id);
            const item = navigation.createEl('li');

            const link = item.createEl('a', {
                text: widget.id,
                href: `#${sectionId}`,
            });

            link.addEventListener('click', (event) => {
                event.preventDefault();

                containerEl.querySelector(`#${sectionId}`)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
            });
        }
    }

    /**
     * Renders the settings sections contributed by registered widgets.
     *
     * Iterates through the widget registry and skips widgets that do not
     * define a settings renderer. For each remaining widget, it creates a
     * section with a heading and delegates the section's controls to the
     * widget's renderSettings method.
     *
     * The widget receives a settings context from the application coordinator
     * so that changes can be persisted and the widget can react to updated
     * settings.
     *
     * @param containerEl - The root element of the settings page.
     */
    private renderWidgetSettings(containerEl: HTMLElement): void {
        for (const widget of WIDGETS) {
            if (!widget.renderSettings) {
                continue;
            }

            const section = containerEl.createDiv({
                cls: 'akki-settings-section',
            });

            section.id = this.getWidgetSectionId(widget.id);

            new Setting(section)
                .setName(widget.id)
                .setHeading();

            widget.renderSettings(
                section,
                this.pluginApp.get_widget_settings_context(widget),
            );
        }
    }

    /**
     * Generates the DOM ID used to identify a widget's settings section.
     *
     * Keeping ID generation in one place ensures that navigation links and
     * their destination sections use the same identifier format.
     *
     * @param widgetId - The unique identifier of the widget.
     * @returns The DOM ID assigned to the widget's settings section.
     */
    private getWidgetSectionId(widgetId: string): string {
        return `widget-${widgetId}`;
    }
}

export { AkkiObsidianSettingTab };
