import { App, PluginSettingTab, Setting } from "obsidian";
import type { AkkiObsidianApp } from "../core/app";
import { renderRootSettings } from "./root-settings";

export class AkkiObsidianSettingTab extends PluginSettingTab {
	constructor(app: App, private readonly pluginApp: AkkiObsidianApp) {
		super(app, pluginApp.plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Akki Obsidian plugin")
			.setHeading()
			.settingEl.setAttribute("id", "akki-plugin-definition");
		containerEl.createEl("p", { text: "A personal workspace and activity management plugin." });

		const navigation = containerEl.createDiv({ cls: "akki-settings-navigation" });
		const sections = [
			{ label: "Plugin-wide", id: "root-settings" },
			...this.pluginApp.features.map((feature) => ({ label: feature.name, id: `feature-${feature.id}` })),
		];
		for (const section of sections) {
			const link = navigation.createEl("a", { text: section.label, href: `#${section.id}` });
			link.addEventListener("click", (event) => {
				event.preventDefault();
				containerEl.querySelector(`#${section.id}`)?.scrollIntoView({ behavior: "smooth" });
			});
		}

		new Setting(containerEl).setName("Plugin-wide").setHeading().settingEl.setAttribute("id", "root-settings");
		renderRootSettings(containerEl, {
			settings: this.pluginApp.settings,
			save: () => this.pluginApp.saveSettings(),
		});

		for (const feature of this.pluginApp.features) {
			new Setting(containerEl).setName(feature.name).setDesc(feature.description).setHeading().settingEl.setAttribute("id", `feature-${feature.id}`);
			feature.renderSettings(containerEl);
		}
	}
}
