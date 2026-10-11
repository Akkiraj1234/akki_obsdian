import type { FeatureDefinition } from "../../core/feature";
import { renderHobbiesSettings } from "./settings";
import { DEFAULT_HOBBIES_SETTINGS, type HobbiesSettings } from "./types";

const hobbiesFeature: FeatureDefinition<HobbiesSettings> = {
	id: "hobbies",
	name: "Hobbies management",
	description: "Manage hobbies, skills, and activity tracking.",
	defaultSettings: DEFAULT_HOBBIES_SETTINGS,
	renderSettings: renderHobbiesSettings,
};

export default hobbiesFeature;
