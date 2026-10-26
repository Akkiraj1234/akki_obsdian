import { FAKE_HOBBIES, HONNY_PLANNER } from "./fakedata.js";


/*
this is the main class to fatch hobbies related data
this class provide api to fatch those data these provides
1. get : takes id and return hobbie data
2. get_childen : retrun childen for that hobbie
3. get_all : return full data with continues on each 20

not everything is implemented yet
*/

class HobbyManager {

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

class HobbyPlannerManager {

    get(month = null, year = null) {
        target_year = this.#normalizeYear(year);
        target_month = this.#normalizeMonth(month, year);

    }

    #normalizeYear(year) {
        if (year == null) {
            year = new Date.g
        }
    }

    #normalizeMonth(month, year) {

    }
}









function test_run() {
    const data = new HobbyManager();
    console.log(data.get("hobby-coding"))
    console.log(data.get_children("hobby-coding"))
    console.log(data.get_children("hobby-leetcode"))
    console.log(data.get_all())
}
test_run();
