import {
    FAKE_HOBBIES,
    HOBBY_PLANNER,
    ACTIVITY_INFO,
    ACTIVITY_HEATMAP_DATA

} from './fakedata.js';

export const LONG_MONTHS = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December',
];

export const SHORT_MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr',
    'May', 'Jun', 'Jul', 'Aug', 'Sep',
    'Oct', 'Nov', 'Dec'
];

export const VALID_DATA_TYPE = [
    'boolean',
    'count',
    'duration',
    'rating'
];

export const prefefinedcolor = [
    "#EBEDF0", // Level 0
    "#9BE9A8", // Level 1
    "#40C463", // Level 2
    "#30A14E", // Level 3
    "#216E39"  // Level 4
];


/**
 * Validates an array of exactly five HEX color values.
 *
 * Each color must be a string in either 3-digit or 6-digit HEX format,
 * starting with `#` (e.g. `#FFF` or `#FFFFFF`).
 *
 * @param {string[]} colors
 *        An array containing exactly five valid HEX color values.
 *
 * @throws {TypeError}
 *         If `colors` is not an array, or if any element is not a
 *         valid HEX color string.
 *
 * @throws {RangeError}
 *         If the array does not contain exactly five colors.
 *
 * @returns {string[]}
 *          A shallow copy of the validated color array.
 */
function validatecolor(colors) {
    if (!Array.isArray(colors)) {
        throw new TypeError("Colors must be an array.");
    }

    if (colors.length !== 5) {
        throw new RangeError("Colors must contain exactly 5 colors.");
    }

    const hexPattern = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

    colors.forEach((color, index) => {
        if (typeof color !== "string" || !hexPattern.test(color)) {
            throw new TypeError(
                `Invalid color at index ${index}: ${color}. Expected a valid HEX color.`
            );
        }
    });

    return [...colors];
}

/**
 * Generates a section and slot filter from planner data.
 *
 * Includes every allowed slot for each planner section.
 *
 * @param {Object} plannerData
 *        Planner sections keyed by section ID.
 *
 * @returns {Object<string, number[]>}
 *          Section IDs mapped to their allowed slot IDs.
 */
export function getSectionIdFilterByPlanner(plannerData) {
    if (!plannerData?.data || typeof plannerData.data !== "object" || Array.isArray(plannerData.data)) {
        throw new TypeError("Expected a planner object containing section data.");
    }

    return Object.fromEntries(
        Object.entries(plannerData.data).map(([sectionId, section]) => [
            sectionId,
            Array.from(
                { length: section.slotsAllow },
                (_, index) => index
            )
        ])
    );
}

/**
 * Generates a hobby ID filter from planner activity data.
 *
 * Collects unique hobby IDs from activity records associated
 * with the supplied planner.
 *
 * Activity data must be provided either:
 * - Through the result of HobbyPlannerManager.get_with_activity().
 * - As a separate activity data object.
 *
 * @param {Object} plannerData
 *        Planner data containing its associated activity property,
 *        or planner data accompanied by separately supplied activity.
 *
 * @param {Object<number, Array>} [activityData]
 *        Optional activity records indexed by month.
 *        Provide this when activity data is not included in plannerData.
 *
 * @returns {string[]}
 *          An array of unique hobby IDs found in the activity records.
 */
export function getHobbyIdFilterByPlanner(plannerData, activityData = null) {
    const activities = activityData ?? plannerData.activity;
    const hobbyIds = new Set();

    for (const monthActivities of Object.values(activities)) {
        for (const activity of monthActivities) {
            hobbyIds.add(activity.id);
        }
    }

    return [...hobbyIds];
}


/**
 * HobbyManager
 *
 * Provides a centralized interface for retrieving and managing
 * hobby-related data.
 *
 * Maintains an internal cache of parent-child relationships to
 * make child hobby lookups more efficient.
 *
 * All returned data is provided as independent copies to prevent
 * accidental modifications to the original data source.
 *
 * Responsibilities:
 * - Retrieve an individual hobby by its ID.
 * - Retrieve an individual hobby with its children.
 * - Retrieve all hobbies.
 * - Retrieve all hobbies with children nested under their parents.
 * - Retrieve all direct child hobbies belonging to a parent hobby.
 * - Maintain an internal cache for parent-child lookups.
 *
 * Public methods:
 *
 * - `get(hobbyid, child)`:
 *   Retrieves an individual hobby by its ID.
 *   Optionally includes its direct children.
 *
 * - `get_all(child)`:
 *   Retrieves the complete hobby collection.
 *   Optionally nests child hobbies inside their respective parents.
 *
 * - `get_children(hobbyid)`:
 *   Retrieves all direct child hobbies belonging to the specified hobby.
 *
 * Internal properties:
 *
 * - `#childrenCache`:
 *   Stores parent-child relationships using hobby IDs.
 *   Built once during initialization and reused for subsequent lookups.
 *
 * Note:
 * When child inclusion is enabled, child hobbies are returned
 * inside their parent and are not included as separate top-level entries.
 */
export class HobbyManager {
    #childrenCache = new Map();

    /**
     * Initializes the HobbyManager.
     *
     * Builds an internal lookup cache of parent-child relationships
     * from the available hobby collection.
     *
     * The cache stores child hobby IDs mapped to their respective
     * parent hobby IDs and is reused by subsequent child lookups.
     */
    constructor() {
        // Build parent-child lookup once.
        for (const [id, hobby] of Object.entries(FAKE_HOBBIES)) {
            if (!this.#childrenCache.has(hobby.parentId)) {
                this.#childrenCache.set(hobby.parentId, []);
            }

            if (hobby.parentId !== null) {
                this.#childrenCache.get(hobby.parentId).push(id);
            }
        }
    }

    /**
     * Retrieves an individual hobby by its ID.
     *
     * Optionally includes all direct child hobbies belonging to it.
     *
     * @param {string} hobbyid
     *        Unique identifier of the requested hobby.
     *
     * @param {boolean} [child=false]
     *        Whether to include the hobby's direct children.
     *
     * @returns {Object|null}
     *          An independent copy of the hobby data,
     *          optionally containing a `children` property.
     *          Returns null if the hobby does not exist.
     */
    get(hobbyid, child = false) {
        const hobby = FAKE_HOBBIES[hobbyid];

        if (!hobby) return null;

        const result = structuredClone(hobby);

        if (child) {
            result.children = this.get_children(hobbyid);
        }

        return result;
    }

    /**
     * Retrieves the complete collection of hobbies.
     *
     * Optionally nests direct child hobbies inside their respective
     * parent hobbies.
     *
     * When child inclusion is enabled, only root-level hobbies
     * are returned as top-level entries.
     *
     * @param {boolean} [child=false]
     *        Whether to include child hobbies nested inside their parents.
     *
     * @returns {Object}
     *          An object containing hobbies indexed by their IDs.
     *          When child is enabled, each root hobby contains a
     *          `children` property with its direct child hobbies.
     */
    get_all(child = false) {
        const result = {};

        for (const [id, hobby] of Object.entries(FAKE_HOBBIES)) {
            // Skip child hobbies as top-level entries when nesting is enabled.
            if (child && hobby.parentId !== null) continue;

            result[id] = structuredClone(hobby);

            if (child) {
                result[id].children = this.get_children(id);
            }
        }

        return result;
    }

    /**
     * Retrieves all direct child hobbies belonging to a parent hobby.
     *
     * Uses the internal parent-child lookup cache to find matching
     * hobby IDs without scanning the entire hobby collection.
     *
     * @param {string} hobbyid
     *        Unique identifier of the parent hobby.
     *
     * @returns {Object}
     *          An object containing matching child hobbies,
     *          indexed by their IDs.
     *          Returns an empty object if no children are found.
     */
    get_children(hobbyid) {
        const childIds = this.#childrenCache.get(hobbyid) ?? [];
        const result = {};

        for (const id of childIds) {
            result[id] = structuredClone(FAKE_HOBBIES[id]);
        }

        return result;
    }
}

/**
 * ActivityManager
 *
 * Manages and retrieves hobby activity data.
 *
 * Provides methods to retrieve activity records by month,
 * hobby ID, or section ID. Supports optional filtering to
 * narrow down the returned activity data.
 *
 * Filtering can be performed using hobby IDs, section IDs,
 * and their corresponding slot IDs.
 *
 * The class exposes dedicated retrieval methods for different
 * use cases while keeping the underlying filtering logic private.
 *
 * @class ActivityManager
 */
export class ActivityManager {
    /**
     * Filters activity items based on the provided criteria.
     *
     * @param {Object} options
     * @param {number[]} [options.onlyhobbyid]
     *        An array of hobby IDs. Only activities belonging
    *        to the specified hobbies will be included. An empty
    *        array means no hobby filter is applied.
     *
     * @param {Object<number, number[]>} [options.onlysectionid]
     *        An object where each key represents a section ID
     *        and its value is an array of slot IDs.
     *
     *        Only activities matching the specified section IDs
    *        and their corresponding slots will be included. An empty
    *        object means no section filter is applied.
     */
    #filterItems({ data, onlyhobbyid = [], onlysectionid = {} }) {
        let result = data;

        if (onlyhobbyid.length) {
            result = result.filter(entry =>
                onlyhobbyid.includes(entry?.id)
            );
        }

        if (onlysectionid && Object.keys(onlysectionid).length) {
            result = result.filter(entry =>
                onlysectionid[entry?.sectionid]?.includes(entry?.slot) ?? false
            );
        }

        return result;
    }

    /**
     * Retrieves activity data for a given year and month range.
     *
     * Retrieves activities between the specified starting and ending
     * months (inclusive). Each month's activity data can optionally
     * be filtered by hobby IDs, section IDs, and their corresponding slots.
     *
     * @param {number} year
     *        Target year (e.g. 2026).
     *
     * @param {number} [start=0]
     *        Starting month index (0–11). Defaults to January.
     *
     * @param {number} [end=11]
     *        Ending month index (0–11). Defaults to December.
     *
     * @param {Object|null} [filterobj=null]
     *        Optional filtering criteria applied to each month's activities.
     *
     * @param {string[]} [filterobj.onlyhobbyid]
     *        Array of hobby IDs to include.
     *
     * @param {Object<string, number[]>} [filterobj.onlysectionid]
     *        Maps section IDs to arrays of slot IDs to include.
     *
     * @param {Object} [options={}]
     *        Optional settings controlling the retrieval behaviour.
     *
     * @param {boolean} [options.throwOnEmpty=false]
    *        Whether to throw when the year has no activity data,
    *        the month range has no activity months, or the filters
    *        match no activity records. Defaults to false, returning
    *        an empty object or empty month arrays instead.
     *
     * @returns {Object<string, Array>}
     *          Activity data indexed by month, containing only
     *          activities matching the specified filters.
    *          Empty hobby or section filters do not filter out
    *          any activity records.
     *          Returns an empty object if no matching data exists
     *          and throwOnEmpty is false.
     *
     * @throws {RangeError}
     *         If the month range is invalid.
     *
     * @throws {Error}
     *         If no activity data exists for the requested year
     *         or month range and throwOnEmpty is true.
     */
    get_by_month(year, start = 0, end = 11, filterobj = null, { throwOnEmpty = false } = {}) {
        const data = ACTIVITY_INFO[year];

        if (!data) {
            if (!throwOnEmpty) return {};
            throw new Error(`No activity data available for year ${year}.`);
        }

        if (
            !Number.isInteger(start) ||
            !Number.isInteger(end) ||
            start < 0 || start > 11 ||
            end < 0 || end > 11 ||
            start > end
        ) {
            throw new RangeError(
                "Invalid month range. Expected 0 <= start <= end <= 11."
            );
        }

        const result = Object.fromEntries(
            Object.entries(data)
                .filter(([month]) => {
                    const index = Number(month);
                    return index >= start && index <= end;
                })
                .map(([month, activities]) => [
                    month,
                    filterobj
                        ? this.#filterItems({ data: activities, ...filterobj })
                        : activities
                ])
        );

        const hasMatchingActivity = Object.values(result).some(activities => activities.length > 0);

        if (Object.keys(result).length === 0 || (filterobj && throwOnEmpty && !hasMatchingActivity)) {
            if (!throwOnEmpty) return {};
            throw new Error("No activity data available for the given month range or filters.");
        }

        return result;
    }

    /**
     * Retrieves activity data for a given year, filtered by hobby IDs.
     *
     * An empty list means no hobby filter is applied, so all activity
     * records for the year are returned.
     *
     * @param {number} year
     *        The year to retrieve activities for.
     *
     * @param {string[]} hobbyids
     *        Hobby IDs to include. An empty list includes every hobby.
     *
     * @param {Object} [options={}]
     *        Optional settings, including throwOnEmpty.
     *
     * @returns {Object<string, Array>}
     *          Activity data indexed by month.
     */
    get_by_hobbyid(year, hobbyids, options = {}) {
        return this.get_by_month(year, 0, 11, {
            onlyhobbyid: hobbyids
        }, options);
    }

    /**
     * Retrieves activity data for a given year, filtered by section IDs
     * and their corresponding slot IDs.
     *
     * @param {number} year
     *        The year to retrieve activities for.
     *
     * @param {Object<string, number[]>} sectionids
    *        An object mapping section IDs to arrays of slot IDs. An
    *        empty object means no section filter is applied, so all
    *        activity records are returned.
     *
     * @param {Object} [options={}]
     *        Optional settings controlling the retrieval behaviour.
     *
     * @param {boolean} [options.throwOnEmpty=false]
     *        Whether to throw an error when no matching activity data exists.
     *
     * @returns {Object<string, Array>}
     *          Activity data indexed by month, matching the specified
     *          sections and slots. Returns an empty object if no matching
     *          data exists and throwOnEmpty is false.
     *
     * @throws {Error}
     *         If no matching activity data exists and throwOnEmpty is true.
     */
    get_by_sectionid(year, sectionids, options = {}) {
        return this.get_by_month(year, 0, 11, {
            onlysectionid: sectionids
        }, options);
    }
}


/**
 * ActivityHeatmapManager
 *
 * Manages activity heatmap data and generates formatted heatmap
 * and graph data for individual hobbies.
 *
 * Supports customizable heatmap colors and target-history-based
 * intensity calculations.
 *
 * Public methods:
 *
 * @method get
 * Returns formatted monthly heatmap data for a specific hobby.
 * Each daily entry includes its date, activity amount, target,
 * intensity level (0–4), label, and colors.
 *
 * @method get_original
 * Returns a cloned copy of the original, unformatted monthly
 * heatmap data for a specific hobby.
 *
 * @method get_graph
 * Returns graph data for a specific month and hobby.
 * Divides daily activity values into the requested number of
 * segments and calculates the average for each segment.
 *
 * @method get_graph_year
 * Returns graph data for an entire year and hobby.
 * Combines available monthly activity data, divides it into
 * the requested number of segments, and calculates the average
 * for each segment.
 *
 * @param {string[]} [colors]
 * Optional custom palette containing exactly five valid HEX colors,
 * representing heatmap intensity levels 0–4.
 */
export class ActivityHeatmapManager {

    constructor(colors) {
        this.hobbies = new HobbyManager();

        this.colors = colors
            ? validatecolor(colors)
            : [...prefefinedcolor];
    }

    #buildTargetCache(targetHistory, totalDays) {
        const cache = [];
        let targetIndex = 0;
        let target = null;

        for (let day = 1; day <= totalDays; day++) {

            while (
                targetIndex < targetHistory.length &&
                targetHistory[targetIndex].from <= day
            ) {
                target = targetHistory[targetIndex].target;
                targetIndex++;
            }

            cache.push(target);
        }

        return cache;
    }

    #getColor(value) {
        return this.colors[value];
    }

    #formatheatmapdata(data, year, month) {
        return Object.fromEntries(
            Object.entries(data).map(([hobbyid, entry]) => {

                const targetCache = this.#buildTargetCache(
                    entry.targetHistory,
                    entry.values.length
                );

                return [
                    hobbyid,
                    entry.values.map((amount, index) => {
                        const day = index + 1;
                        const date = [
                            year,
                            String(month + 1).padStart(2, "0"),
                            String(day).padStart(2, "0")
                        ].join("-");

                        return this.#formatheatmapentries(
                            hobbyid,
                            date,
                            amount,
                            targetCache[index]
                        );
                    })
                ];
            })
        );
    }

    #formatheatmapentries(hobbyid, date, amount, target) {
        const hobbydata = this.hobbies.get(hobbyid);

        if (!hobbydata) {
            throw new Error(`Hobby not found: ${hobbyid}`);
        }

        target ??= hobbydata.target;

        // Calculate intensity (0–4).
        const ratio = target > 0 ? amount / target : 0;

        const value =
            amount <= 0 ? 0 :
                ratio <= 0.25 ? 1 :
                    ratio <= 0.50 ? 2 :
                        ratio <= 0.75 ? 3 : 4;

        // Generate label.
        let label;

        switch (hobbydata.unit_type) {
            case "boolean":
                label = amount > 0 ? "Done" : "Not done";
                break;

            case "count":
            case "duration":
                label = `${amount}/${target} ${hobbydata.unit_name}`;
                break;

            case "rating":
                label = `${amount}/${target}`;
                break;

            default:
                label = String(amount);
        }

        return {
            date,
            value,
            amount,
            target,
            label,
            color: this.#getColor(value),
            labelColor: hobbydata.color
        };
    }

    #buildGraph(data, points) {
        if (!Number.isInteger(points) || points < 1) {
            throw new RangeError("Points must be a positive integer.");
        }

        const totalDays = data.length;

        if (totalDays === 0) {
            return Array(points).fill(0);
        }

        const result = [];

        for (let i = 0; i < points; i++) {
            const start = Math.floor(i * totalDays / points);
            const end = Math.floor((i + 1) * totalDays / points);

            const segment = data.slice(start, end);

            const average = segment.length
                ? segment.reduce((sum, value) => sum + value, 0) / segment.length
                : 0;

            result.push(Number(average.toFixed(2)));
        }

        return result;
    }

    /**
     * Returns the original, unformatted heatmap data.
     *
     * @param {number} year - Full year.
     * @param {number} month - Zero-based month index (0–11).
     * @param {string} hobbyid - Hobby identifier.
     * @returns {Object} Cloned original activity data.
     */
    get_original(year, month, hobbyid) {
        const yearData = ACTIVITY_HEATMAP_DATA[year];

        if (!yearData) {
            throw new Error(`No data available for year ${year}.`);
        }

        if (!Number.isInteger(month) || month < 0 || month > 11) {
            throw new RangeError("Month must be an integer between 0 and 11.");
        }

        const result = yearData[month]?.[hobbyid];

        if (!result) {
            throw new Error(`No heatmap data available for hobby ${hobbyid}.`);
        }

        return structuredClone(result);
    }

    /**
     * Returns formatted heatmap data for a specific hobby and month.
     *
     * @param {number} year - Full year (e.g. 2026).
     * @param {number} month - Zero-based month index (0–11).
     * @param {string} hobbyid - Hobby identifier.
     * @returns {Object} Formatted heatmap data keyed by hobby ID.
     */
    get(year, month, hobbyid) {
        const data = this.get_original(year, month, hobbyid);

        return this.#formatheatmapdata(
            { [hobbyid]: data },
            year,
            month
        )
    }

    /**
     * Generates graph data for a specific month.
     *
     * @param {number} year - Full year.
     * @param {number} month - Zero-based month index (0–11).
     * @param {string} hobbyid - Hobby identifier.
     * @param {number} [points=10] - Number of graph points to generate.
     * @returns {Object} Graph data containing hobby color and averaged values.
     */
    get_graph(year, month, hobbyid, points = 10) {
        const original = this.get_original(year, month, hobbyid);
        const hobby = this.hobbies.get(hobbyid);

        if (!hobby) {
            throw new Error(`Hobby not found: ${hobbyid}`);
        }

        return {
            [hobbyid]: {
                color: hobby.color,
                values: this.#buildGraph(original.values, points)
            }
        };
    }


    /**
     * Generates graph data for an entire year.
     *
     * @param {number} year - Full year.
     * @param {string} hobbyid - Hobby identifier.
     * @param {number} [points=10] - Number of graph points to generate.
     * @returns {Object} Graph data containing hobby color and averaged values.
    */
    get_graph_year(year, hobbyid, points = 10) {
        const yearData = ACTIVITY_HEATMAP_DATA[year];

        if (!yearData) {
            throw new Error(`No data available for year ${year}.`);
        }

        const hobby = this.hobbies.get(hobbyid);

        if (!hobby) {
            throw new Error(`Hobby not found: ${hobbyid}`);
        }

        const values = [];

        for (let month = 0; month < 12; month++) {
            const monthData = yearData[month]?.[hobbyid];

            if (!monthData) continue;

            values.push(...monthData.values);
        }

        return {
            [hobbyid]: {
                color: hobby.color,
                values: this.#buildGraph(values, points)
            }
        };
    }
}


/**
 * HobbyPlannerManager
 *
 * Manages the retrieval and reconstruction of Hobby Planner data
 * for a specific month and year.
 *
 * Uses the latest available snapshot and the recorded monthly changes
 * to reconstruct the planner's state at a requested point in time.
 *
 * The manager automatically resolves the closest available year and
 * month when the requested values are not directly available.
 *
 * Responsibilities:
 * - Retrieve planner data for a specific month and year.
 * - Resolve the closest available year and month.
 * - Reconstruct historical planner states by reversing recorded changes.
 * - Restore section data and display order when reconstructing history.
 * - Return a structured and independent copy of the requested planner data.
 * - Provide an interface for retrieving planner data alongside activity data.
 *
 * Historical reconstruction supports the following change actions:
 * - `create`: Removes the section when reversing its creation.
 * - `update`: Restores the section's previous state.
 * - `delete`: Restores the deleted section and its original position.
 *
 * Public methods:
 * - `get(month, year)`:
 *   Retrieves planner data for the requested month and year.
 *
 * - `get_with_activity()`:
 *   Retrieves planner data together with its associated activity data.
 *
 * Internal methods:
 * - `#closestYear(year)`:
 *   Resolves the closest available planner year.
 *
 * - `#closestmonth(month, year)`:
 *   Resolves the closest available month within the selected year.
 *
 * - `#getPreviousState(year_data, target_month)`:
 *   Reconstructs a historical planner state by reversing monthly changes.
 *
 * - `#packData(month_data, order, year, month)`:
 *   Packages the planner data into a structured response.
 *
 * @class HobbyPlannerManager
 */
export class HobbyPlannerManager {

    constructor() {
        this.hobbyactivity = new ActivityManager()
    }

    /**
     * Retrieves the latest year and month recorded in the hobby planner.
     *
     * The month is represented as a zero-based index (0–11).
     *
     * @returns {[number, number]}
     *          A tuple containing the latest year and month index.
     */
    latest_year_and_month() {
        return [
            HOBBY_PLANNER.latest_year,
            HOBBY_PLANNER.data[HOBBY_PLANNER.latest_year].latestMonth
        ];
    }

    /**
     * Retrieves the planner state for a specific month and year.
     *
     * Resolves the closest available year and month, then retrieves
     * the corresponding planner state using either the latest snapshot
     * or historical state reconstruction.
     *
     * @param {number|null} [month=null]
     *        Target month (0–11, where 0 represents January).
     *        Defaults to the current month.
     *
     * @param {number|null} [year=null]
     *        Target year (e.g. 2026).
     *        Defaults to the current year.
     *
     * @returns {Object}
     *          An independent copy of the planner state containing
     *          title, description, year, month, data, and order.
     *
     * @throws {TypeError}
     *         If the provided year or month is invalid.
     *
     * @throws {Error}
     *         If no planner data or available months exist.
     */
    get(year = null, month = null) {
        const target_year = this.#closestYear(year);
        const target_month = this.#closestmonth(target_year, month);
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

    /**
     * Retrieves planner data together with its associated activity data.
     *
     * Combines the reconstructed planner state with activity records
     * for the corresponding month and year.
     *
     * @returns {Object}
     *          Planner data along with associated activity information.
     */
    get_with_activity(year = null, month = null) {
        const planner = this.get(year, month);

        if (!planner) {
            throw new Error("Cannot generate data: internal error");
        }

        const onlysectionid = getSectionIdFilterByPlanner(
            planner.data
        );

        const activity = this.hobbyactivity.get_by_month(
            planner.year,
            0,
            planner.month,
            { onlysectionid }
        );

        return {
            ...planner,
            activity
        };
    }

    /**
     * Resolves the closest available planner year.
     *
     * If no year is provided, the current year is used.
     * When the requested year is unavailable, the closest
     * existing year is selected.
     *
     * @param {number|null} year
     *        Requested year.
     *
     * @returns {number}
     *          The closest available planner year.
     *
     * @throws {TypeError}
     *         If the provided year is not an integer.
     *
     * @throws {Error}
     *         If no planner years are available.
     */
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

    /**
     * Resolves the closest available month within a given year.
     *
     * If no month is provided, the current month is used.
     * Selects the latest available month that is less than
     * or equal to the requested month.
     *
     * @param {number|null} month
     *        Requested month (0–11).
     *
     * @param {number} year
     *        Year in which the month should be resolved.
     *
     * @returns {number}
     *          The closest available month.
     *
     * @throws {TypeError}
     *         If the provided month is not an integer between 0 and 11.
     *
     * @throws {Error}
     *         If no planner data or available months exist for the year.
     */
    #closestmonth(year, month) {
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

    /**
     * Reconstructs a historical planner state by reversing
     * the changes recorded after the target month.
     *
     * Starts with the latest snapshot and reverses monthly changes
     * in descending chronological order.
     *
     * Supported change actions:
     * - `update`: Restores the previous section data.
     * - `create`: Removes the newly created section.
     * - `delete`: Restores the deleted section and its original position.
     *
     * @param {Object} year_data
     *        Planner data containing the latest snapshot, display order,
     *        latest month, and recorded monthly changes.
     *
     * @param {number} target_month
     *        Target month to reconstruct (0–11).
     *
     * @returns {{data: Object, order: string[]}}
     *          Reconstructed section data and its display order.
     *
     * @throws {Error}
     *         If the snapshot, target month, or recorded changes are invalid,
     *         or if a change cannot be reversed.
     */
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

    /**
     * Packages planner data into a structured response.
     *
     * Creates independent copies of the supplied section data
     * and display order to prevent modifications to the original
     * planner state.
     *
     * @param {Object} month_data
     *        Section data for the requested month.
     *
     * @param {string[]} order
     *        Display order of section IDs.
     *
     * @param {number} year
     *        Resolved planner year.
     *
     * @param {number} month
     *        Resolved planner month (0–11).
     *
     * @returns {Object}
     *          Packaged planner data containing:
     *          - title
     *          - description
     *          - year
     *          - month
     *          - data
     *          - order
     */
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