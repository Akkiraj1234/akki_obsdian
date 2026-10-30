import assert from "node:assert/strict";
import test from "node:test";

import {
    FAKE_HOBBIES,
    HOBBY_PLANNER
} from "./fakedata.js";

import {
    HobbyManager,
    HobbyPlannerManager
} from "./dataFacther.js";


// ==================================================
// TEST SETUP
// ==================================================

const hobbyManager = new HobbyManager();
const plannerManager = new HobbyPlannerManager();

const hobbyIds = Object.keys(FAKE_HOBBIES);
const availableYears = Object.keys(HOBBY_PLANNER.data).map(Number);


// ==================================================
// TEST HELPERS
// ==================================================

function getAvailableMonths(yearData) {
    return [...new Set([
        ...Object.keys(yearData.changes).map(Number),
        yearData.latestMonth
    ])]
        .filter(m => Number.isInteger(m) && m >= 0 && m <= 11)
        .sort((a, b) => a - b);
}

function getClosestYear(year) {
    return availableYears.reduce((closest, current) =>
        Math.abs(current - year) < Math.abs(closest - year)
            ? current
            : closest
    );
}

function getClosestMonth(month, yearData) {
    const months = getAvailableMonths(yearData);

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


// ==================================================
// HOBBY MANAGER
// ==================================================

test("HobbyManager", async t => {

    // ----------------------------------------------
    // GET
    // ----------------------------------------------

    await t.test("get existing hobby", () => {
        const id = hobbyIds[0];

        assert.ok(id);

        assert.deepStrictEqual(
            hobbyManager.get(id),
            FAKE_HOBBIES[id]
        );
    });

    await t.test("get nonexistent hobby", () => {
        assert.equal(hobbyManager.get("__missing__"), null);
    });

    await t.test("get null hobby", () => {
        assert.equal(hobbyManager.get(null), null);
    });

    await t.test("get undefined hobby", () => {
        assert.equal(hobbyManager.get(undefined), null);
    });

    await t.test("get returns independent data", () => {
        const id = hobbyIds[0];
        const result = hobbyManager.get(id);

        result.__testMutation = true;

        assert.equal(
            FAKE_HOBBIES[id].__testMutation,
            undefined
        );
    });

    await t.test("get deep clone protects nested data", () => {
        const id = hobbyIds.find(id =>
            Object.values(FAKE_HOBBIES[id])
                .some(value => value !== null && typeof value === "object")
        );

        if (!id) {
            return t.skip("No nested object found in fake hobbies.");
        }

        const original = structuredClone(FAKE_HOBBIES[id]);
        const result = hobbyManager.get(id);

        const nestedKey = Object.keys(result).find(key =>
            result[key] !== null && typeof result[key] === "object"
        );

        result[nestedKey].__testMutation = true;

        assert.deepStrictEqual(FAKE_HOBBIES[id], original);
    });


    // ----------------------------------------------
    // GET ALL
    // ----------------------------------------------

    await t.test("get_all returns complete database", () => {
        assert.deepStrictEqual(
            hobbyManager.get_all(),
            FAKE_HOBBIES
        );
    });

    await t.test("get_all returns independent data", () => {
        const result = hobbyManager.get_all();

        result.__testMutation = true;

        assert.equal(
            FAKE_HOBBIES.__testMutation,
            undefined
        );
    });

    await t.test("get_all deep clone protects nested data", () => {
        const original = structuredClone(FAKE_HOBBIES);
        const result = hobbyManager.get_all();

        const id = hobbyIds[0];

        result[id].__testMutation = true;

        assert.deepStrictEqual(FAKE_HOBBIES, original);
    });


    // ----------------------------------------------
    // GET CHILDREN
    // ----------------------------------------------

    await t.test("get_children returns direct children", () => {
        const parentId = hobbyIds.find(id =>
            hobbyIds.some(childId =>
                FAKE_HOBBIES[childId].parentId === id
            )
        );

        if (!parentId) {
            return t.skip("No parent with children found.");
        }

        const result = hobbyManager.get_children(parentId);

        for (const [id, data] of Object.entries(result)) {
            assert.equal(data.parentId, parentId);
            assert.equal(FAKE_HOBBIES[id].parentId, parentId);
        }
    });

    await t.test("get_children excludes unrelated hobbies", () => {
        const parentId = hobbyIds.find(id =>
            hobbyIds.some(childId =>
                FAKE_HOBBIES[childId].parentId === id
            )
        );

        if (!parentId) {
            return t.skip("No parent with children found.");
        }

        const result = hobbyManager.get_children(parentId);

        for (const id of hobbyIds) {
            if (FAKE_HOBBIES[id].parentId !== parentId) {
                assert.equal(
                    Object.hasOwn(result, id),
                    false
                );
            }
        }
    });

    await t.test("get_children returns empty object for leaf hobby", () => {
        const leafId = hobbyIds.find(id =>
            !hobbyIds.some(childId =>
                FAKE_HOBBIES[childId].parentId === id
            )
        );

        if (!leafId) {
            return t.skip("No leaf hobby found.");
        }

        assert.deepStrictEqual(
            hobbyManager.get_children(leafId),
            {}
        );
    });

    await t.test("get_children returns empty object for missing parent", () => {
        assert.deepStrictEqual(
            hobbyManager.get_children("__missing__"),
            {}
        );
    });

    await t.test("get_children with null returns root hobbies", () => {
        const expected = Object.fromEntries(
            Object.entries(FAKE_HOBBIES)
                .filter(([_, data]) => data.parentId === null)
        );

        assert.deepStrictEqual(
            hobbyManager.get_children(null),
            expected
        );
    });

    await t.test("get_children returns independent data", () => {
        const parentId = hobbyIds.find(id =>
            hobbyIds.some(childId =>
                FAKE_HOBBIES[childId].parentId === id
            )
        );

        if (!parentId) {
            return t.skip("No parent with children found.");
        }

        const result = hobbyManager.get_children(parentId);
        const childId = Object.keys(result)[0];

        result[childId].__testMutation = true;

        assert.equal(
            FAKE_HOBBIES[childId].__testMutation,
            undefined
        );
    });

});


// ==================================================
// HOBBY PLANNER MANAGER
// ==================================================

test("HobbyPlannerManager", async t => {

    // ----------------------------------------------
    // DATABASE
    // ----------------------------------------------

    await t.test("planner contains at least one year", () => {
        assert.ok(availableYears.length > 0);
    });

    await t.test("planner years are valid integers", () => {
        for (const year of availableYears) {
            assert.ok(Number.isInteger(year));
        }
    });


    // ----------------------------------------------
    // INPUT VALIDATION
    // ----------------------------------------------

    await t.test("rejects invalid years", () => {
        const invalidYears = [
            "2026",
            2026.5,
            NaN,
            Infinity,
            -Infinity,
            true,
            false,
            {},
            []
        ];

        for (const year of invalidYears) {
            assert.throws(
                () => plannerManager.get(0, year),
                TypeError
            );
        }
    });

    await t.test("rejects invalid months", () => {
        const invalidMonths = [
            -1,
            12,
            1.5,
            NaN,
            Infinity,
            -Infinity,
            "5",
            true,
            false,
            {},
            []
        ];

        for (const month of invalidMonths) {
            assert.throws(
                () => plannerManager.get(month, availableYears[0]),
                TypeError
            );
        }
    });

    await t.test("accepts null arguments", () => {
        assert.doesNotThrow(() => plannerManager.get(null, null));
    });

    await t.test("accepts month zero", () => {
        assert.doesNotThrow(() =>
            plannerManager.get(0, availableYears[0])
        );
    });

    await t.test("accepts month eleven", () => {
        assert.doesNotThrow(() =>
            plannerManager.get(11, availableYears[0])
        );
    });


    // ----------------------------------------------
    // DEFAULT VALUES
    // ----------------------------------------------

    await t.test("get without arguments", () => {
        const result = plannerManager.get();

        assert.ok(result);
        assert.equal(typeof result.year, "number");
        assert.ok(Number.isInteger(result.month));
        assert.ok(result.month >= 0 && result.month <= 11);
        assert.ok(result.data);
        assert.ok(Array.isArray(result.order));
    });

    await t.test("get with null arguments", () => {
        const result = plannerManager.get(null, null);

        assert.ok(result);
        assert.ok(result.data);
    });


    // ----------------------------------------------
    // YEAR SELECTION
    // ----------------------------------------------

    await t.test("selects exact available year", () => {
        const year = availableYears[0];

        const result = plannerManager.get(0, year);

        assert.equal(result.year, year);
    });

    await t.test("selects closest available year", () => {
        const requestedYear = availableYears[0] - 100;

        const result = plannerManager.get(0, requestedYear);

        assert.equal(
            result.year,
            getClosestYear(requestedYear)
        );
    });

    await t.test("selects first encountered year on equal distance", () => {
        if (availableYears.length < 2) {
            return t.skip("Need at least two available years.");
        }

        const years = [...availableYears].sort((a, b) => a - b);

        const gap = years[1] - years[0];

        if (gap % 2 !== 0) {
            return t.skip("No integer year exactly between years.");
        }

        const requestedYear = years[0] + gap / 2;

        const result = plannerManager.get(0, requestedYear);

        assert.equal(
            result.year,
            getClosestYear(requestedYear)
        );
    });


    // ----------------------------------------------
    // MONTH SELECTION
    // ----------------------------------------------

    await t.test("selects exact available month", () => {
        const year = availableYears[0];
        const months = getAvailableMonths(HOBBY_PLANNER.data[year]);

        const result = plannerManager.get(months[0], year);

        assert.equal(result.month, months[0]);
    });

    await t.test("selects previous available month", () => {
        const year = availableYears.find(y =>
            getAvailableMonths(HOBBY_PLANNER.data[y]).length >= 2
        );

        if (year === undefined) {
            return t.skip("Need at least two available months.");
        }

        const months = getAvailableMonths(HOBBY_PLANNER.data[year]);

        const first = months[0];
        const second = months[1];

        if (second - first <= 1) {
            return t.skip("No missing month between available months.");
        }

        const result = plannerManager.get(first + 1, year);

        assert.equal(result.month, first);
    });

    await t.test("handles request before first available month", () => {
        const year = availableYears[0];
        const months = getAvailableMonths(HOBBY_PLANNER.data[year]);

        const result = plannerManager.get(0, year);

        const expected = months[0] === 0
            ? months[0]
            : months[months.length - 1];

        assert.equal(result.month, expected);
    });

    await t.test("handles request after latest available month", () => {
        const year = availableYears[0];
        const months = getAvailableMonths(HOBBY_PLANNER.data[year]);

        const result = plannerManager.get(11, year);

        assert.equal(result.month, months[months.length - 1]);
    });


    // ----------------------------------------------
    // LATEST SNAPSHOT
    // ----------------------------------------------

    await t.test("returns latest snapshot", () => {
        const year = availableYears[0];
        const yearData = HOBBY_PLANNER.data[year];

        const result = plannerManager.get(yearData.latestMonth, year);

        assert.deepStrictEqual(result.data, yearData.latest);
        assert.deepStrictEqual(result.order, yearData.order);
    });

    await t.test("returns latest snapshot for future month", () => {
        const year = availableYears.find(y =>
            HOBBY_PLANNER.data[y].latestMonth < 11
        );

        if (year === undefined) {
            return t.skip("No future month available.");
        }

        const yearData = HOBBY_PLANNER.data[year];

        const result = plannerManager.get(11, year);

        assert.deepStrictEqual(result.data, yearData.latest);
        assert.deepStrictEqual(result.order, yearData.order);
    });


    // ----------------------------------------------
    // HISTORICAL RECONSTRUCTION
    // ----------------------------------------------

    await t.test("reconstructs historical month", () => {
        const year = availableYears.find(y =>
            getAvailableMonths(HOBBY_PLANNER.data[y])
                .some(m => m < HOBBY_PLANNER.data[y].latestMonth)
        );

        if (year === undefined) {
            return t.skip("No historical month available.");
        }

        const yearData = HOBBY_PLANNER.data[year];

        const target = getAvailableMonths(yearData)
            .find(m => m < yearData.latestMonth);

        const result = plannerManager.get(target, year);

        assert.equal(result.year, year);
        assert.equal(result.month, target);
        assert.ok(result.data);
        assert.ok(Array.isArray(result.order));
    });

    await t.test("returns independent latest snapshot data", () => {
        const year = availableYears[0];
        const yearData = HOBBY_PLANNER.data[year];

        const original = structuredClone(yearData.latest);
        const result = plannerManager.get(yearData.latestMonth, year);

        result.data.__testMutation = true;
        result.order.push("__testMutation");

        assert.deepStrictEqual(yearData.latest, original);
        assert.equal(
            yearData.order.includes("__testMutation"),
            false
        );
    });

    await t.test("returns independent historical data", () => {
        const year = availableYears.find(y =>
            getAvailableMonths(HOBBY_PLANNER.data[y])
                .some(m => m < HOBBY_PLANNER.data[y].latestMonth)
        );

        if (year === undefined) {
            return t.skip("No historical month available.");
        }

        const yearData = HOBBY_PLANNER.data[year];

        const target = getAvailableMonths(yearData)
            .find(m => m < yearData.latestMonth);

        const result = plannerManager.get(target, year);

        result.data.__testMutation = true;
        result.order.push("__testMutation");

        assert.equal(
            yearData.latest.__testMutation,
            undefined
        );
    });


    // ----------------------------------------------
    // OUTPUT STRUCTURE
    // ----------------------------------------------

    await t.test("returns correct output structure", () => {
        const result = plannerManager.get();

        assert.equal(result.title, HOBBY_PLANNER.title);
        assert.equal(result.description, HOBBY_PLANNER.description);

        assert.ok(Object.hasOwn(result, "year"));
        assert.ok(Object.hasOwn(result, "month"));
        assert.ok(Object.hasOwn(result, "data"));
        assert.ok(Object.hasOwn(result, "order"));
    });

    await t.test("returns numeric month and year", () => {
        const result = plannerManager.get();

        assert.equal(typeof result.year, "number");
        assert.equal(typeof result.month, "number");
    });

    await t.test("repeated calls return consistent results", () => {
        const year = availableYears[0];

        const first = plannerManager.get(0, year);
        const second = plannerManager.get(0, year);

        assert.deepStrictEqual(first, second);
    });

});
