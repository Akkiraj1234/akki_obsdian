import { Setting } from 'obsidian';
import type { WidgetSettingsContext } from '@/core/types';
import type { HobbieTrackerSettings } from './types';


const DEFAULT_SETTINGS: HobbieTrackerSettings = {
    showRibbonIcon: true,
};

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