export interface HobbiesSettings {
	dataFilePath: string;
	showAddButton: boolean;
	showQuickTicker: boolean;
}

export const DEFAULT_HOBBIES_SETTINGS: HobbiesSettings = {
	dataFilePath: "",
	showAddButton: true,
	showQuickTicker: true,
};
