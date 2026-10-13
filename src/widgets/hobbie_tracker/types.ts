import type { WidgetSettings } from '@/core/types';


/**
 * Defines the user preferences for the Hobby Tracker widget.
 *
 * Extends the shared widget settings structure with options that control
 * how the widget integrates with the Obsidian workspace.
 */
interface HobbieTrackerSettings extends WidgetSettings {
    showRibbonIcon: boolean;
}

export type { HobbieTrackerSettings };