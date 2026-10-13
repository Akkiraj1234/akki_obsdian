import { Setting } from 'obsidian';
import type { WidgetSettingsContext } from '@/core/types';
import type { HobbieTrackerSettings } from './types';


/**
 * Default configuration for the Hobby Tracker widget.
 *
 * The ribbon icon is enabled by default, allowing users to access
 * the widget from the Obsidian workspace.
 */
const DEFAULT_SETTINGS: HobbieTrackerSettings = {
    showRibbonIcon: true,
};

/**
 * Renders the Hobby Tracker settings controls.
 *
 * Provides a toggle that allows users to show or hide the widget's
 * ribbon icon. Changes are applied through the supplied settings
 * context, which handles persistence and notifies the widget.
 *
 * @param containerEl - The HTML element in which the settings are rendered.
 * @param context - The widget's current settings and update mechanism.
 */
function renderHobbieTrackerSettings(
    containerEl: HTMLElement,
    context: WidgetSettingsContext<HobbieTrackerSettings>,
    
): void {
    const { settings, updateSettings } = context;

    new Setting(containerEl)
        .setName('Show ribbon icon')
        .setDesc(
            'Display an icon in the left ribbon to quickly open hobby actions.',
        )
        .addToggle((toggle) =>
            toggle
                .setValue(settings.showRibbonIcon)
                .onChange(async (value) => {
                    await updateSettings((setting) => {
                        setting.showRibbonIcon = value;
                    });
                }),
        );
}

export { DEFAULT_SETTINGS, renderHobbieTrackerSettings };