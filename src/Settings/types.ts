
export interface AkkiObsidianSettings {
	showCompletedTasks: boolean;
	dataFilePath: string;
    
	hobbies: {
		enabled: boolean;
		showCompletedActivities: boolean;
	};

	newPageInterface: {
		enabled: boolean;
	};
}

export const DEFAULT_SETTINGS: AkkiObsidianSettings = {
	showCompletedTasks: false,
	dataFilePath: "",

	hobbies: {
		enabled: true,
		showCompletedActivities: false,
	},

	newPageInterface: {
		enabled: true,
	},
};
