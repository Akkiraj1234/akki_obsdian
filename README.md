# OnePlugin

> **An all-in-one Obsidian plugin for organising everyday life.**

<!-- Project logo/banner placeholder: add an approved project image here when available. -->

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-0.1.3-informational)
![Status](https://img.shields.io/badge/status-in_development-yellow)

OnePlugin brings personal organisation tools into Obsidian. The project is in active development; feature details and setup instructions will grow alongside the plugin.

## Contents

- [Features](#features)
- [Preview](#preview)
- [Installation](#installation)
- [Documentation](#documentation)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Features

### Hobby tools

The current source includes hobby management and planning modules. Their user-facing workflows are still being developed.

### New tab

The current source includes a configurable new tab widget. Setup and usage instructions will be documented as this feature matures.

### GitHub activity

The new tab includes a GitHub activity widget. When opened or refreshed with a username configured, it requests that account's public events directly from GitHub's public API. The plugin does not send vault content, collect analytics, or store a GitHub token.

## Preview

<!-- Screenshot/demo placeholder: add genuine OnePlugin screenshots or a short demo when available. -->

_Screenshots and demo coming soon._

## Installation

OnePlugin does not yet have a published installation guide or community listing. For development builds, follow the [developer setup](#development) and use a dedicated test vault.

## Documentation

- [Feature notes](docs/everything.md)
- [Developer documentation](docs/dev/README.md)
- [User documentation](docs/user/README.md)
- [Architecture decision records](docs/adr/README.md)

## Development

### Requirements

- Node.js 18 or newer
- npm
- A dedicated Obsidian test vault

Install dependencies with `npm install`. Create a local `workflow.json` in the repository root:

```json
{
	"testVaultPath": "C:/path/to/your/test-vault"
}
```

`workflow.json` is local configuration and is ignored by Git. Keep it out of commits.

### Available scripts

| Command                                    | What it does                                                                                                                                                                       |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                              | Starts esbuild in watch mode and rebuilds when source files change.                                                                                                                |
| `npm run build`                            | Checks TypeScript and creates production plugin files under `build/oneplugin-obsidian/`.                                                                                           |
| `npm run build-test`                       | Runs the production build, copies its plugin files into the configured test vault, then tries to open that vault in Obsidian. If Obsidian is already open, reload OnePlugin there. |
| `npm test`                                 | Runs the MarkDB test suites.                                                                                                                                                       |
| `npm run lint`                             | Checks the project with ESLint.                                                                                                                                                    |
| `npm version patch` (or `minor` / `major`) | Updates the package version and synchronizes `manifest.json` and `versions.json`.                                                                                                  |
| `npm run release`                          | Checks lint and build, creates a versioned Git commit and tag, then pushes them to `origin` to start the release workflow. Use only when preparing a release.                      |

To test a development build, run `npm run build-test`. The script creates the plugin folder if needed and only copies `main.js`, `manifest.json`, and `styles.css` when present; it does not remove other vault files.

### Project structure

```text
src/                 Plugin source code
  core/              Shared plugin logic and MarkDB implementation
  widgets/           User-facing widget modules
playground/          Standalone UI experiments and prototypes
docs/                User, developer, and architecture documentation
.github/workflows/   GitHub Actions automation
```

For more detail, see [the source overview](src/README.md) and [the playground notes](playground/README.md).

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Keep changes focused, update relevant documentation, and never include local `workflow.json` configuration.

## License

OnePlugin is distributed under the [GNU General Public License v3.0](LICENSE).
