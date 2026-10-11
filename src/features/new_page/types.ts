export interface HobbiesSettings {
	/** Vault-relative folder containing habits.md and one YYYY.md file per year. */
	databaseFolderPath: string;
	showAddButton: boolean;
	showQuickTicker: boolean;
}

export const DEFAULT_HOBBIES_SETTINGS: HobbiesSettings = {
	databaseFolderPath: "Habit tracker data",
	showAddButton: true,
	showQuickTicker: true,
};
