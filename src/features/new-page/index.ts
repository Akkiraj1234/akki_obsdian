import type { FeatureDefinition } from "../../core/feature";
import { renderNewPageSettings } from "./settings";
import { DEFAULT_NEW_PAGE_SETTINGS, type NewPageSettings } from "./types";

const newPageFeature: FeatureDefinition<NewPageSettings> = {
	id: "new-page",
	name: "New-page interface",
	description: "Configure the custom page interface.",
	defaultSettings: DEFAULT_NEW_PAGE_SETTINGS,
	renderSettings: renderNewPageSettings,
};

export default newPageFeature;
