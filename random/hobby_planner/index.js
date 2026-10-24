
document.getElementsByClassName("")


function renderLablePanel({lables}) {
    if (!Array.isArray(lables) || !length(lables[0] > 0 || typeof lables[0] === "undefined")){
        throw "renderLablePanel need valid input"
    }

    const heading = document.getElementById("lable-heading");
    const label_list = document.getElementById("lable-lists");
    heading.textContent = "Hobby Planner"

    for (const section of lables) {
        const section_heading = document.createElement("div");
        section_heading.className = "label-section-row";
        section_heading.textContent = section.name;


        Object.entries(section.data).map(((name, data) => {
            
        }));
        label_list.appendChild(
            
        )
    }
}

function mainrender() {
    
}

const FakeData = {
    lables: [
        { 
            section_nmae: "MainSkill",
            items: [
                {name: "coding", color: "some color", id: "someid", parent: null},
                {name: "leetcode", color: "some color", id: "someid", parent: "coding"}
            ],
            timeline: [
                {}
            ]
        },
        { 
            section_nmae: "MainSkill",
            items: [
                {name: "coding", color: "some color", id: "someid", parent: null},
                {name: "book-reading", color: "some color", id: "someid", parent: null}
            ]
        },
        { 
            section_nmae: "Activity",
            items: [
                {name: "Chess", color: "some color", id: "someid", parent: null}
            ]
        },
        { 
            section_nmae: "Gym",
            items: [
                {name: "home-workout", color: "some color", id: "someid", parent: null}
            ]
        },
    ],
    timeline: []
}

timeline_data = {
    jan: {
        
    }
}
mainrender();