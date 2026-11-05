class HobbyManagerElement extends HTMLElement {
    connectedCallback() {
        if (this.shadowRoot) return;

        const shadow = this.attachShadow({ mode: "open" });
        const stylesheet = document.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.href = new URL("./index.css", import.meta.url).href;

        const content = document.createElement("div");
        content.className = "hobby-manager-content";
        content.append(document.createElement("slot"));
        shadow.append(stylesheet, content);
    }
}

customElements.define("hobby-manager", HobbyManagerElement);
