import { Hobby, HobbyPlanner } from './fakedata.js';

const hobbies = new Hobby();
const planner = new HobbyPlanner();

// 1. check hobby status
console.log('\n========== HOBBY ==========');
console.dir(hobbies.get('hobby-coding'), { depth: null });

// 2. Test the current planner
console.log('\n========== CURRENT PLANNER ==========');
console.dir(planner.get('curr'), { depth: null });
console.dir(planner.get(2026, 'dec'));

// // 3. Test historical planner states
// console.log('\n========== JANUARY 2026 ==========');
// console.dir(planner.get(2026, 'jan'), { depth: null });

// console.log('\n========== JUNE 2026 ==========');
// console.dir(planner.get(2026, 'jun'), { depth: null });

// console.log('\n========== OCTOBER 2026 ==========');
// console.dir(planner.get(2026, 'oct'), { depth: null });

// // 4. Test available diff months
// console.log('\n========== DIFF MONTHS ==========');
// console.log('2026:', planner.get_diff_list(2026));
// console.log('2025:', planner.get_diff_list(2025));

// // 5. Test heatmap data
// console.log('\n========== GRAPH DATA ==========');
// console.dir(getGraphData(['hobby-coding', 'hobby-reading'], 2026, 10), { depth: null });
