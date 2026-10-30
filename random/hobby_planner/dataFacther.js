import { FAKE_HOBBIES, HOBBY_PLANNER, ACTIVITY_INFO, ACTIVITY_HEATMAP_DATA } from './fakedata.js';

export const MONTHS = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December',
];

export const VALID_DATA_TYPE = [
    'boolean',
    'count',
    'duration',
    'rating'
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
        );
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
        const target_year = this.#closestYear(year);
        const target_month = this.#closestmonth(month, target_year);
        const year_data = HOBBY_PLANNER.data[target_year];

        if (!year_data) {
            throw new Error(`No data available for year ${year}.`);
        }

        if (target_month >= year_data.latestMonth) {
            return this.#packData(
                year_data.latest,
                year_data.order,
                target_year,
                target_month,
            );
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

    #closestYear(year) {
        if (year == null) {
            year = new Date().getFullYear();
        }

        if (typeof year !== 'number' || !Number.isInteger(year)) {
            throw new TypeError('Year must be a valid number.');
        }

        const years = Object.keys(HOBBY_PLANNER.data).map(Number);

        if (years.length === 0) {
            throw new Error('No years available in the planner.');
        }

        return years.reduce((closest, current) =>
            Math.abs(current - year) < Math.abs(closest - year)
                ? current
                : closest,
        );
    }

    #closestmonth(month, year) {
        month ??= new Date().getMonth();
        const year_data = HOBBY_PLANNER.data[year];

        if (
            typeof month !== 'number' ||
            !Number.isInteger(month) ||
            month < 0 ||
            month > 11
        ) {
            throw new TypeError('Month must be an integer between 0 and 11.');
        }

        if (!year_data) {
            throw new Error(`No data available for year ${year}.`);
        }

        const available = [
            ...Object.keys(year_data.changes).map(Number),
            year_data.latestMonth,
        ];

        const months = [...new Set(available)]
            .filter((m) => Number.isInteger(m) && m >= 0 && m <= 11)
            .sort((a, b) => a - b);

        if (months.length === 0) {
            throw new Error(`No months available for year ${year}.`);
        }

        let closest = months[months.length - 1];

        for (const current of months) {
            if (current <= month) {
                closest = current;
            } else {
                break;
            }
        }

        return closest;
    }

    #getPreviousState(year_data, target_month) {
        const latest_month = year_data.latestMonth;

        if (
            !Number.isInteger(latest_month) ||
            latest_month < 0 ||
            latest_month > 11
        ) {
            throw new Error(`Invalid latestMonth: ${latest_month}`);
        }

        if (
            !Number.isInteger(target_month) ||
            target_month < 0 ||
            target_month > 11
        ) {
            throw new Error(`Invalid target month: ${target_month}`);
        }

        if (target_month > latest_month) {
            throw new Error('Target month is later than the latest snapshot.');
        }

        const current_data = structuredClone(year_data.latest);
        const current_order = [...year_data.order];

        for (let month = latest_month - 1; month >= target_month; month--) {
            const changes = year_data.changes[month] ?? {};

            for (const [id, change] of Object.entries(changes)) {
                if (change.action === 'update') {
                    if (!Object.hasOwn(current_data, id)) {
                        throw new Error(
                            `Cannot reverse update: section ${id} is missing.`,
                        );
                    }

                    if (change.previous == null) {
                        throw new Error(
                            `Missing previous data for section ${id}.`,
                        );
                    }
                    current_data[id] = structuredClone(change.previous);

                } else if (change.action === 'create') {
                    if (!Object.hasOwn(current_data, id)) {
                        throw new Error(
                            `Cannot reverse creation: section ${id} is missing.`,
                        );
                    }

                    delete current_data[id];
                    const index = current_order.indexOf(id);

                    if (index !== -1) {
                        current_order.splice(index, 1);
                    }

                } else if (change.action === 'delete') {
                    if (Object.hasOwn(current_data, id)) {
                        throw new Error(
                            `Cannot reverse deletion: section ${id} already exists.`,
                        );
                    }

                    if (change.previous == null) {
                        throw new Error(
                            `Missing previous data for deleted section ${id}.`,
                        );
                    }

                    current_data[id] = structuredClone(change.previous);
                    const index = Math.max(
                        0,
                        Math.min(
                            change.index ?? current_order.length,
                            current_order.length,
                        ),
                    );
                    current_order.splice(index, 0, id);

                } else {
                    throw new Error(
                        `Unknown action "${change.action}" for section ${id}.`,
                    );
                }
            }
        }

        return {
            data: current_data,
            order: current_order,
        };
    }

    #packData(month_data, order, year, month) {
        return {
            title: HOBBY_PLANNER.title,
            description: HOBBY_PLANNER.description,
            year: year,
            month: month,
            data: structuredClone(month_data),
            order: [...order],
        };
    }
}

export class ActivityManager { }

export class ActivityHeatmapManager { }
