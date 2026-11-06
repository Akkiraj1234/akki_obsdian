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
    constructor() {

    }

    initialize() {

    }

    render() {

    }

    destroy() {

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
