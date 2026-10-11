import type { FeatureDefinition } from "../../feature";
import {
	DEFAULT_HOBBIES_SETTINGS,
	type HobbiesSettings,
} from "./types";
import { renderHobbiesSettings } from "./settings";

const hobbiesFeature: FeatureDefinition<HobbiesSettings> = {
	id: "hobbies",
	name: "Hobbies management",
	description: "Manage hobbies, skills, and activity tracking.",

	defaultSettings: DEFAULT_HOBBIES_SETTINGS,

	renderSettings: renderHobbiesSettings,
};

export default hobbiesFeature;