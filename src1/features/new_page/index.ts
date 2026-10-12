import type { FeatureDefinition } from "../../core/feature";
import { DEFAULT_HOBBIES_SETTINGS, type HobbiesSettings } from "./types";
import { HobbiesController } from "./controller";

let controller: HobbiesController | null = null;

const hobbiesFeature: FeatureDefinition<HobbiesSettings> = {
	id: "hobbies",
	name: "Hobbies management",
	description: "Manage hobbies, skills, and activity tracking.",
	defaultSettings: DEFAULT_HOBBIES_SETTINGS,
	renderSettings: (containerEl, context) => {
		if (controller) controller.renderSettings(containerEl, context);
	},
	initialize: async (context) => {
		controller = new HobbiesController(context.app);
		await controller.initialize(context);
	},
};

export default hobbiesFeature;
