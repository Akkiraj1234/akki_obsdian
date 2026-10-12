import type { App } from "obsidian";
import type { FeatureContext } from "./feature";

export interface FeatureHost {
	app: App;
	register: (cleanup: () => void) => void;
}

export function createFeatureContext<TSettings>(
	host: FeatureHost,
	settingsConfig: TSettings,
	save: () => Promise<void>,
): FeatureContext<TSettings> {
	return {
		app: host.app,
		settingsConfig,
		updateSettings: async (update) => {
			update(settingsConfig);
			await save();
		},
		registerCleanup: (cleanup) => host.register(cleanup),
	};
}
