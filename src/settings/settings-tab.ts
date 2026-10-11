import { App, PluginSettingTab, Setting } from "obsidian";
import type { AkkiObsidianApp } from "../core/app";


class AkkiObsidianSettingTab extends PluginSettingTab {
	constructor( app: App, private readonly pluginApp: AkkiObsidianApp ) {
		super(app, pluginApp.plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const header = containerEl.createDiv({
			cls: "setting-item akki-settings-header",
		});

		const headingInfo = header.createDiv({
			cls: "setting-item-info akki-settings-heading-info",
		});

		headingInfo.createEl("p", {
			text: "Akki Obsidian plugin",
			cls: "setting-item-name",
		});

		headingInfo.createEl("p", {
			text: "A collection of tools to manage life and integrate Obsidian into my daily workflow.",
			cls: "setting-item-description",
		});

		const headerItems = header.createDiv({
			cls: "setting-item-info akki-settings-heading-items",
		});

		headerItems.createEl("p", {
			text: "Explore features",
			cls: "setting-item-name",
		});

		const navigation = headerItems.createEl("ol", {
			cls: "akki-settings-navigation",
		});
		
		for (const feature of this.pluginApp.features) {
			const id = `feature-${feature.id}`;

			const item = navigation.createEl("li");
			const link = item.createEl("a", {
				text: feature.name,
				href: `#${id}`,
			});

			link.addEventListener("click", (event) => {
				event.preventDefault();

				containerEl.querySelector(`#${id}`)?.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
			});
		}

		for (const feature of this.pluginApp.features) {
			const section = containerEl.createDiv({
				cls: "akki-settings-section",
			});

			section.id = `feature-${feature.id}`;

			new Setting(section)
				.setName(feature.name)
				.setDesc(feature.description)
				.setHeading();

			feature.renderSettings(section);
		}
	}
}

export { AkkiObsidianSettingTab };
