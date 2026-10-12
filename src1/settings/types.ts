export interface RootSettings {
	showCompletedTasks: boolean;
	dataFilePath: string;
}

export interface PluginSettings extends RootSettings {
	features: Record<string, unknown>;
}

export const DEFAULT_ROOT_SETTINGS: RootSettings = {
	showCompletedTasks: false,
	dataFilePath: "",
};
