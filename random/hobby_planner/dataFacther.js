import { FAKE_HOBBIES, HOBBY_PLANNER, ACTIVITY_INFO, ACTIVITY_LOGS } from "./fakedata.js";

const MONTHS = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December",
];

const VALID_DATA_TYPE = [
    "boolean",
    "count",
    "duration",
    "rating"
];


/*
this is the main class to fatch hobbies related data
this class provide api to fatch those data these provides
1. get : takes id and return hobbie data
2. get_childen : retrun childen for that hobbie
3. get_all : return full data with continues on each 20

not everything is implemented yet
*/

export class HobbyManager {

    get(hobbyid) {
        const result = FAKE_HOBBIES[hobbyid];
        return result ? structuredClone(result) : null;
    }

    get_all() {
        return structuredClone(FAKE_HOBBIES);
    }

    get_children(hobbyid) {
        return Object.fromEntries(
            Object.entries(FAKE_HOBBIES)
                .filter(([_, data]) => data.parentId === hobbyid)
                .map(([id, data]) => [id, structuredClone(data)])
        )
    }
}


/*
this class repersent hobby planner data state for all months
for all year and its keep track of changes we did in hobbies
these class provide api such as

get: this function takes month and year as input if given its try 
    to return the closest data avliable from that data to provide hobby
    planner state if month and year not given its takes curr year and curr month
    as input
*/
export class HobbyPlannerManager {

    get(month = null, year = null) {
        const target_year = this.#normalizeYear(year);
        const target_month = this.#normalizeMonth(month, target_year);

        const year_data = HOBBY_PLANNER.data[target_year];
        if (!year_data) {
            throw new Error(`No data available for year ${year}.`);
        }

        if (target_month === year_data.latestMonth) {
            return this.#packData(
                year_data.latest,
                year_data.order,
                target_year,
                target_month
            )
        }

        const { data, order } = this.#getPreviousState(
            year_data,
            target_month
        );

        return this.#packData(
            data,
            order,
            target_year,
            target_month
        );

    }

    get_with_activity() {

    }

    #normalizeYear(year) {
        if (year == null) {
            year = new Date().getFullYear();
        }

        if (typeof year !== "number" || !Number.isInteger(year)) {
            throw new TypeError("Year must be a valid number.");
        }

        const years = Object.keys(HOBBY_PLANNER.data).map(Number);

        if (years.length === 0) {
            throw new Error("No years available in the planner.");
        }

        return years.reduce((closest, current) =>
            Math.abs(current - year) < Math.abs(closest - year)
                ? current
                : closest
        );
    }

    #normalizeMonth(month, year) {
        if (month == null) {
            month = MONTHS[new Date().getMonth()];

        } else {
            if (typeof month !== "string") {
                throw new TypeError("Month must be a string.");
            }

            month = month.trim().slice(0, 3).toLowerCase();
        }

        const target = MONTHS.indexOf(month);

        if (target === -1) {
            throw new TypeError("Invalid month.");
        }

        const yearData = HOBBY_PLANNER.data[year];

        if (!yearData) {
            throw new Error(`No data available for year ${year}.`);
        }

        const available = [
            ...Object.keys(yearData.changes),
            yearData.latestMonth,
        ]
            .map(m => m.toLowerCase())
            .filter(m => MONTHS.includes(m));

        const uniqueMonths = [...new Set(available)]
            .sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));

        if (uniqueMonths.length === 0) {
            throw new Error(`No months available for year ${year}.`);
        }

        const previous = uniqueMonths.filter(
            m => MONTHS.indexOf(m) <= target
        );

        return previous.length
            ? previous[previous.length - 1]
            : uniqueMonths[uniqueMonths.length - 1];
    }

    #packData(month_data, order, year, month) {
        return {
            title: HOBBY_PLANNER.title,
            description: HOBBY_PLANNER.description,
            year: year,
            month: month,
            data: month_data,
            order: order
        }
    }

    #getPreviousState(year_data, target_month) {
        const latest_index = MONTHS.indexOf(year_data.latestMonth);
        const target_index = MONTHS.indexOf(target_month);

        if (latest_index === -1) {
            throw new Error(`Invalid latestMonth: ${year_data.latestMonth}`);
        }

        if (target_index === -1) {
            throw new Error(`Invalid target month: ${target_month}`);
        }

        if (target_index > latest_index) {
            throw new Error("Target month is later than the latest snapshot.");
        }

        const current_data = structuredClone(year_data.latest);
        const current_order = [...year_data.order];

        // Walk backwards from the latest snapshot to the target month.
        for (let i = latest_index; i > target_index; i--) {
            // This key stores the previous state to restore.
            const history_month = MONTHS[i - 1];
            const changes = year_data.changes[history_month] ?? {};

            for (const [id, change] of Object.entries(changes)) {
                switch (change.action) {
                    case "update": {
                        if (!Object.hasOwn(current_data, id)) {
                            throw new Error(
                                `Cannot reverse update: section ${id} is missing.`
                            );
                        }

                        if (change.previous == null) {
                            throw new Error(
                                `Missing previous data for section ${id}.`
                            );
                        }

                        current_data[id] = structuredClone(change.previous);
                        break;
                    }

                    case "create": {
                        if (!Object.hasOwn(current_data, id)) {
                            throw new Error(
                                `Cannot reverse creation: section ${id} is missing.`
                            );
                        }

                        delete current_data[id];

                        const index = current_order.indexOf(id);

                        if (index !== -1) {
                            current_order.splice(index, 1);
                        }

                        break;
                    }

                    case "delete": {
                        if (Object.hasOwn(current_data, id)) {
                            throw new Error(
                                `Cannot reverse deletion: section ${id} already exists.`
                            );
                        }

                        if (change.previous == null) {
                            throw new Error(
                                `Missing previous data for deleted section ${id}.`
                            );
                        }

                        current_data[id] = structuredClone(change.previous);

                        const index = Math.max(
                            0,
                            Math.min(
                                change.index ?? current_order.length,
                                current_order.length
                            )
                        );

                        current_order.splice(index, 0, id);
                        break;
                    }

                    default:
                        throw new Error(
                            `Unknown action "${change.action}" for section ${id}.`
                        );
                }
            }
        }

        return {
            data: current_data,
            order: current_order,
        };
    }
}

export class ActivityManager {

}

export class ActivityHeatmapManager {

}






function test_run() {
    // const data = new HobbyManager();
    // console.log(data.get("hobby-coding"))
    // console.log(data.get_children("hobby-coding"))
    // console.log(data.get_children("hobby-leetcode"))
    // console.log(data.get_all())

    const hobblyplanner = new HobbyPlannerManager();
    console.log(hobblyplanner.get());
    console.log(hobblyplanner.get("sep", 2026));


}
test_run();
