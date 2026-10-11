import type { RootSettings } from "./types";

export interface RootSettingsContext {
	settings: RootSettings;
	save: () => Promise<void>;
}