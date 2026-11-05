# Source code

This folder contains the TypeScript and CSS bundled into the OnePlugin Obsidian plugin.

- `main.ts` starts the plugin and connects its core modules.
- `core/` contains shared application logic, settings, types, and the MarkDB implementation.
- `widgets/` contains user-facing widget modules such as hobby tools and the new tab.
- `styles.css` contains the plugin's styles.

Keep production plugin code in this folder and group related functionality by responsibility.
