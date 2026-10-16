import { Setting } from 'obsidian';
import type { WidgetSettingsContext } from '@/core/types';

export interface HobbySettings extends Record<string, unknown> {
    storagePath: string;
    showRibbonIcon: boolean;
}

export const DEFAULT_HOBBY_SETTINGS: HobbySettings = {
    storagePath: 'akki/hobbies',
    showRibbonIcon: true,
};

export function renderHobbySettings(
    containerEl: HTMLElement,
    context: WidgetSettingsContext<HobbySettings>,
): void {
    const { settings } = context;
    const updateSettings = (updater: (current: HobbySettings) => void): Promise<void> =>
        context.updateSettings(updater);
    new Setting(containerEl)
        .setName('Hobby data folder')
        .setDesc('Vault-relative folder for the hobbies file and annual planner and tracker files.')
        .addText((text) => text
            .setPlaceholder('Akki/hobbies')
            .setValue(settings.storagePath)
            .onChange(async (value) => {
                await updateSettings((current) => {
                    current.storagePath = value.trim() || DEFAULT_HOBBY_SETTINGS.storagePath;
                });
            }));
    new Setting(containerEl)
        .setName('Show ribbon icon')
        .setDesc('Show a left-ribbon button that opens the hobby dashboard.')
        .addToggle((toggle) => toggle
            .setValue(settings.showRibbonIcon)
            .onChange(async (value) => {
                await updateSettings((current) => { current.showRibbonIcon = value; });
            }));
}
