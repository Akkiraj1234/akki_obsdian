import {
    PluginSettingTab,
    Setting,
    type App,
    type Plugin,
} from 'obsidian';

import { WIDGETS } from '@/widgets';
import type { AkkiObsidianApp } from '@/core/app';

class AkkiObsidianSettingTab extends PluginSettingTab {
    constructor(
        app: App,
        plugin: Plugin,
        private readonly pluginApp: AkkiObsidianApp,
    ) {
        super(app, plugin);
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // Header
        const header = containerEl.createDiv({
            cls: 'setting-item akki-settings-header',
        });

        const headingInfo = header.createDiv({
            cls: 'setting-item-info akki-settings-heading-info',
        });

        headingInfo.createEl('p', {
            text: 'Akki Obsidian Plugin',
            cls: 'setting-item-name',
        });

        headingInfo.createEl('p', {
            text: 'A collection of tools to manage life and integrate Obsidian into my daily workflow.',
            cls: 'setting-item-description',
        });

        // Navigation
        const navigationInfo = header.createDiv({
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
            const id = `widget-${widget.id}`;
            const item = navigation.createEl('li');

            const link = item.createEl('a', {
                text: widget.id,
                href: `#${id}`,
            });

            link.addEventListener('click', (event) => {
                event.preventDefault();

                containerEl.querySelector(`#${id}`)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
            });
        }

        // Widget settings
        for (const widget of WIDGETS) {
            if (!widget.renderSettings) continue;

            const section = containerEl.createDiv({
                cls: 'akki-settings-section',
            });

            section.id = `widget-${widget.id}`;

            new Setting(section)
                .setName(widget.id)
                .setHeading();

            widget.renderSettings(
                section,
                this.pluginApp.get_widget_settings_context(widget),
            );
        }
    }
}

export { AkkiObsidianSettingTab };