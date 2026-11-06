import {
    SHORT_MONTHS,
    HobbyManager,
    ActivityManager,
    HobbyPlannerManager,
    ActivityHeatmapManager,
    getSectionIdFilterByPlanner
} from "../dataFacther.js";

const hobbyManager = new HobbyManager();
const activityManager = new ActivityManager();
const hobbyPlannerManager = new HobbyPlannerManager();
const hobbyHeatmapManager = new ActivityHeatmapManager()


class HobbyManagerUI {

    constructor(element) {
        if (!element || element.nodeType !== 1) {
            throw new TypeError("HobbyPlanner requires a valid HTML element.");
        }

        this.time = new Date();
        this.element = element;
        this.initialized = false;

        this.selectedIndex = 0;
        this.hobbylist = [];
        this.hobbyparentidx = {};
        this.graphCache = {};
    }

    initialize() {
        if (this.initialized) {
            throw new Error("HobbyPlanner is already initialized.");
        }

        this.element.innerHTML = `
            <main class="manager">
                <header class="header">
                    <h2 class="header-label"></h2>
                    <div class="header-options"></div>
                </header>

                <section class="hobby-body" aria-label="Hobbies">
                    <div class="hobby-list">
                        <!-- Hobby entries -->
                    </div>
                </section>
            </main>
        `;

        this.mainbody = this.element.querySelector(".manager");
        this.heading = this.element.querySelector(".header");
        this.headingText = this.element.querySelector(".header-label");
        this.headingOption = this.element.querySelector(".header-options");
        this.hobbyBody = this.element.querySelector(".hobby-body");
        this.hobbyBodyList = this.element.querySelector(".hobby-list");

        this.initialized = true;
        this.#renderPlaceholder();
    }


    render() {

    }

    destroy() {

    }


    #renderPlaceholder() {
        this.headingText.textContent = "Hobby Manager";

        const optionsList = [
            {
                icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.34-4.34"/></svg>`,
                name: "search",
            },
            {
                icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5H2"/><path d="M6 12h12"/><path d="M9 19h6"/><path d="M16 5h6"/><path d="M19 8V2"/></svg>`,
                name: "filter",
            },
            {
                icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>`,
                name: "create"
            }
        ];

        for (const { icon, name } of optionsList) {
            const button = document.createElement("button");

            button.type = "button";
            button.className = `header-button ${name}-button`;
            button.setAttribute("aria-label", name);
            button.innerHTML = icon;

            this.headingOption.append(button);
        }
    }

}


class HobbyManagerElement extends HTMLElement {
    connectedCallback() {
        if (this.shadowRoot) return;

        const shadow = this.attachShadow({ mode: "open" });
        const stylesheet = document.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.href = new URL("./index.css", import.meta.url).href;

        const container = document.createElement("div");
        container.className = "hobby-manager-content";;
        shadow.append(stylesheet, container);

        this.manager = new HobbyManagerUI(container);
        this.manager.initialize();
        this.render();
    }

    disconnectedCallback() {
        this.manager?.destroy();
        this.manager = null;
    }
}

export function main(element) {
    customElements.define("hobby-manager", HobbyManagerElement);
    element.append(
        document.createElement("hobby-manager")
    )
}
