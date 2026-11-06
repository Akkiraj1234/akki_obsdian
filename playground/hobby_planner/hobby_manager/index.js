import {
    LONG_MONTHS,
    HobbyManager,
    ActivityHeatmapManager,
} from "../dataFacther.js";

const hobbyManager = new HobbyManager();
const hobbyHeatmapManager = new ActivityHeatmapManager();

class HobbyManagerUI {
    constructor(element) {
        if (!element || element.nodeType !== 1) {
            throw new TypeError("HobbyManager requires a valid HTML element.");
        }

        this.element = element;
        this.time = new Date();
        this.hobbies = hobbyManager.get_all();
        this.searchQuery = "";
        this.showSearch = false;
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) throw new Error("HobbyManager is already initialized.");

        this.element.innerHTML = `
            <main class="manager">
                <header class="manager-header">
                    <div class="manager-heading">
                        <span class="eyebrow">YOUR ROUTINE, AT A GLANCE</span>
                        <h1 class="header-label">Hobby manager</h1>
                        <p class="header-subtitle">Keep your interests close and your progress visible.</p>
                    </div>
                    <div class="header-options" aria-label="Hobby manager actions"></div>
                </header>
                <section class="manager-content" aria-label="Hobbies">
                    <div class="section-heading">
                        <div><h2>Your hobbies</h2><p class="hobby-count"></p></div>
                        <span class="month-label"></span>
                    </div>
                    <div class="search-wrap" hidden><input class="search-input" type="search" placeholder="Find a hobby…" aria-label="Find a hobby"></div>
                    <div class="hobby-list"></div>
                </section>
            </main>`;

        this.headingOption = this.element.querySelector(".header-options");
        this.hobbyList = this.element.querySelector(".hobby-list");
        this.searchWrap = this.element.querySelector(".search-wrap");
        this.searchInput = this.element.querySelector(".search-input");
        this.searchInput.addEventListener("input", () => {
            this.searchQuery = this.searchInput.value.trim().toLowerCase();
            this.render();
        });
        this.initialized = true;
        this.render();
    }

    render() {
        const hobbies = Object.entries(this.hobbies).filter(([, hobby]) =>
            `${hobby.name} ${hobby.description ?? ""}`.toLowerCase().includes(this.searchQuery)
        );
        this.element.querySelector(".hobby-count").textContent = `${hobbies.length} ${hobbies.length === 1 ? "hobby" : "hobbies"} in your collection`;
        this.element.querySelector(".month-label").textContent = `${LONG_MONTHS[this.time.getMonth()]} ${this.time.getFullYear()}`;
        this.#renderActions();

        const fragment = document.createDocumentFragment();
        for (const [id, hobby] of hobbies) fragment.append(this.#createHobbyCard(id, hobby));
        if (hobbies.length === 0) {
            const empty = document.createElement("div");
            empty.className = "empty-state";
            empty.textContent = this.searchQuery ? "No hobbies match that search." : "No hobbies yet. Add one to get started.";
            fragment.append(empty);
        }
        this.hobbyList.replaceChildren(fragment);
    }

    #renderActions() {
        const search = this.#actionButton("Search hobbies", "search", `<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>`);
        search.setAttribute("aria-pressed", String(this.showSearch));
        search.addEventListener("click", () => {
            this.showSearch = !this.showSearch;
            this.searchWrap.hidden = !this.showSearch;
            if (this.showSearch) this.searchInput.focus();
            else { this.searchInput.value = ""; this.searchQuery = ""; }
            this.render();
        });
        const add = this.#actionButton("Add hobby", "add", `<path d="M12 5v14M5 12h14"/>`);
        add.classList.add("add-hobby-button");
        add.innerHTML += `<span>Add hobby</span>`;
        add.addEventListener("click", () => this.#showAddForm());
        this.headingOption.replaceChildren(search, add);
    }

    #actionButton(label, className, icon) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `header-button ${className}-button`;
        button.setAttribute("aria-label", label);
        button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg>`;
        return button;
    }

    #createHobbyCard(id, hobby) {
        const card = document.createElement("article");
        card.className = "hobby-card";
        card.style.setProperty("--hobby-color", hobby.color || "#7c8cf8");

        const identity = document.createElement("div");
        identity.className = "hobby-identity";
        const marker = document.createElement("span");
        marker.className = "hobby-marker";
        const text = document.createElement("div");
        text.className = "hobby-copy";
        const name = document.createElement("h3");
        name.className = "hobby-name";
        name.textContent = hobby.name;
        const description = document.createElement("p");
        description.className = "hobby-description";
        description.textContent = hobby.description || "Make a little time for what you enjoy.";
        text.append(name, description);
        identity.append(marker, text);

        const target = document.createElement("span");
        target.className = "hobby-target";
        target.textContent = hobby.unit_type === "boolean" ? "Daily habit" : `${hobby.target} ${hobby.unit_name} / day`;

        const graph = this.#createGraph(id, hobby);
        card.append(identity, target, graph);
        return card;
    }

    #createGraph(id, hobby) {
        const wrapper = document.createElement("div");
        wrapper.className = "hobby-graph-wrap";
        const heading = document.createElement("div");
        heading.className = "graph-heading";
        const label = document.createElement("span");
        label.textContent = "MONTHLY ACTIVITY";
        const summary = document.createElement("span");
        summary.className = "graph-summary";

        let values = [];
        try {
            const graphData = hobbyHeatmapManager.get_graph(this.time.getFullYear(), this.time.getMonth(), id, 14)[id];
            values = graphData?.values ?? [];
        } catch (error) {
            console.warn(`Monthly graph unavailable for ${hobby.name}.`, error);
        }
        const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
        summary.textContent = average ? `~${this.#formatAmount(average, hobby)} daily average` : "No activity yet";
        heading.append(label, summary);

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 280 68");
        svg.setAttribute("preserveAspectRatio", "none");
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", `${hobby.name} activity graph for ${LONG_MONTHS[this.time.getMonth()]}`);
        svg.classList.add("activity-chart");
        const baseline = document.createElementNS(svg.namespaceURI, "path");
        baseline.setAttribute("d", "M0 59.5H280");
        baseline.setAttribute("class", "chart-baseline");
        svg.append(baseline);

        if (values.length) {
            const max = Math.max(...values, Number(hobby.target) || 0, 1);
            const points = values.map((value, index) => {
                const x = values.length === 1 ? 140 : 4 + index * 272 / (values.length - 1);
                const y = 54 - (value / max) * 43;
                return [x, y];
            });
            const line = points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
            const area = `${line} L${points.at(-1)[0].toFixed(1)} 59 L${points[0][0].toFixed(1)} 59 Z`;
            const fill = document.createElementNS(svg.namespaceURI, "path");
            fill.setAttribute("d", area);
            fill.setAttribute("class", "chart-area");
            const stroke = document.createElementNS(svg.namespaceURI, "path");
            stroke.setAttribute("d", line);
            stroke.setAttribute("class", "chart-line");
            svg.append(fill, stroke);
        }
        wrapper.append(heading, svg);
        return wrapper;
    }

    #formatAmount(amount, hobby) {
        if (hobby.unit_type === "boolean") return `${amount.toFixed(1)} sessions / day`;
        const formatted = Number.isInteger(amount) ? amount : amount.toFixed(1);
        return `${formatted} ${hobby.unit_name} / day`;
    }

    #showAddForm() {
        if (this.element.querySelector(".add-hobby-form")) return;
        const form = document.createElement("form");
        form.className = "add-hobby-form";
        form.innerHTML = `<label for="new-hobby-name">New hobby</label><input id="new-hobby-name" name="name" maxlength="60" placeholder="e.g. Learn piano" required><button type="submit">Add</button><button type="button" class="cancel-add">Cancel</button>`;
        this.element.querySelector(".manager-content").prepend(form);
        form.querySelector("input").focus();
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const name = new FormData(form).get("name").toString().trim();
            if (!name) return;
            const id = `hobby-${crypto.randomUUID()}`;
            this.hobbies[id] = { name, description: "", parentId: null, unit_name: "sessions", unit_type: "count", target: 1, color: "#818cf8" };
            form.remove();
            this.render();
        });
        form.querySelector(".cancel-add").addEventListener("click", () => form.remove());
    }

    destroy() { this.element.replaceChildren(); }
}

class HobbyManagerElement extends HTMLElement {
    connectedCallback() {
        if (this.shadowRoot) return;
        const shadow = this.attachShadow({ mode: "open" });
        const stylesheet = document.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.href = new URL("./index.css", import.meta.url).href;
        const container = document.createElement("div");
        container.className = "hobby-manager-content";
        shadow.append(stylesheet, container);
        this.manager = new HobbyManagerUI(container);
        this.manager.initialize();
    }

    disconnectedCallback() {
        this.manager?.destroy();
        this.manager = null;
    }
}

export function main(element) {
    if (!customElements.get("hobby-manager")) customElements.define("hobby-manager", HobbyManagerElement);
    element.append(document.createElement("hobby-manager"));
}
