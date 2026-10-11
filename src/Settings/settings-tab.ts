
import { App, PluginSettingTab, Setting } from "obsidian";
import type AkkiObsidianPlugin from "../main";
import { renderRootSettings } from "./root-settings";
import { renderHobbiesSettings } from "../Features/Hobbies/settings";
import { renderNewPageSettings } from "../Features/new-page/settings";

export class AkkiObsidianSettingTab extends PluginSettingTab {
	plugin: AkkiObsidianPlugin;

	constructor(app: App, plugin: AkkiObsidianPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Plugin definition
		new Setting(containerEl)
			.setName("Akki Obsidian plugin")
			.setHeading()
			.settingEl.setAttribute("id", "akki-plugin-definition");

		containerEl.createEl("p", {
			text: "A personal workspace and activity management plugin.",
		});

		const navigation = containerEl.createDiv({
			cls: "akki-settings-navigation",
		});

		const sections = [
			{ label: "Plugin-wide", id: "root-settings" },
			{ label: "Hobbies management", id: "hobbies-management" },
			{ label: "New-page interface", id: "new-page-interface" },
		];

		for (const section of sections) {
			const link = navigation.createEl("a", {
				text: section.label,
				href: `#${section.id}`,
			});

			link.addEventListener("click", (event) => {
				event.preventDefault();

				containerEl
					.querySelector(`#${section.id}`)
					?.scrollIntoView({ behavior: "smooth" });
			});
		}

		// Root settings
		new Setting(containerEl)
			.setName("Plugin-wide")
			.setHeading()
			.settingEl.setAttribute("id", "root-settings");
		renderRootSettings(containerEl, this.plugin);

		// Hobbies management
		new Setting(containerEl)
			.setName("Hobbies management")
			.setHeading()
			.settingEl.setAttribute("id", "hobbies-management");
		renderHobbiesSettings(containerEl, this.plugin);

		// New-page interface
		new Setting(containerEl)
			.setName("New-page interface")
			.setHeading()
			.settingEl.setAttribute("id", "new-page-interface");
		renderNewPageSettings(containerEl, this.plugin);
	}
}
