# Contributing to OnePlugin

Thank you for your interest in contributing to OnePlugin!

OnePlugin aims to make organising life in Obsidian easier through useful tools, thoughtful design and a simple user experience.

Contributions are welcome, whether they involve fixing bugs, improving existing features, proposing ideas or adding new functionality.

Before contributing, please read the following guidelines.

## 1. Project Structure

OnePlugin maintains separate areas for its main codebase, UI experiments and project documentation.

- `src/` — Contains the main plugin codebase and feature implementations.
- `playground/` — Used for experimenting with approved UI ideas and prototypes.
- `docs/` — Contains project documentation, developer guides, user guides and architectural decisions.

Keep code in its appropriate location and avoid mixing experimental implementations with production code.

## 2. Coding Guidelines

OnePlugin prioritises readable, maintainable and well-documented code.

### Documentation

- Every function and method should have a JSDoc comment explaining its purpose.
- Document parameters, return values and thrown errors where applicable.
- Use clear descriptions rather than repeating what the function name already says.
- Update documentation whenever existing functionality or APIs change.

Example:

```js
/**
 * Retrieves a hobby by its unique identifier.
 *
 * @param {string} hobbyId - Unique identifier of the hobby.
 * @returns {Object|null} The hobby data, or null if not found.
 */
get(hobbyId) {
    // Implementation
}
```

### Code Quality

- Use meaningful and descriptive variable and function names.
- Follow the existing naming conventions and coding style.
- Keep functions focused on a single responsibility.
- Avoid unnecessary complexity and overengineering.
- Prefer simple, readable implementations over clever but difficult-to-maintain code.
- Avoid duplicating existing functionality when it can reasonably be reused.
- Keep responsibilities separated between managers, UI components and other modules.
- Handle errors and invalid inputs appropriately.

### Architecture

- Respect the existing project architecture.
- Keep APIs consistent and predictable.
- Avoid introducing unnecessary dependencies.
- Do not introduce breaking changes without considering their impact on existing functionality.
- Document significant architectural decisions through ADRs in `docs/adr/`.

## 3. User Interface Guidelines

OnePlugin aims to provide a clean, minimal and intuitive user experience.

- Prioritise usability and clarity.
- Avoid unnecessary visual elements.
- Maintain consistency across features.
- Consider accessibility when implementing UI components.
- Experimental UI ideas should be developed in `playground/` before being introduced into the main application.
- Only approved UI implementations should be moved into the production codebase.

The `playground/` directory contains standalone experiments and prototypes.

## 4. Development and Testing

Always test your changes before submitting them.

### Obsidian Testing

- Use a dedicated Obsidian test vault.
- Never test development builds inside your existing personal vault.
- Follow the development setup instructions in `docs/dev/`.
- Verify that your changes work correctly inside Obsidian.

### Local Configuration

OnePlugin uses a local `workflow.json` file for development workflow configuration.

- Configure it for your own development environment.
- Never commit or push `workflow.json`.
- Do not include personal machine paths or local environment details in commits.

## 5. Documentation

Documentation is an important part of OnePlugin.

Depending on the change:

- Update `docs/dev/` when developer-facing APIs, architecture or implementation details change.
- Update `docs/user/` when user-facing functionality or instructions change.
- Add or update ADRs when significant architectural decisions are made.

Keep documentation consistent with the actual implementation.

## 6. Pull Requests

Before submitting a pull request:

1. Make sure your changes follow the coding guidelines.
2. Test your implementation in a dedicated Obsidian test vault.
3. Check for errors, warnings and unintended behaviour.
4. Update relevant documentation.
5. Make sure `workflow.json` and other local configuration files are not included.
6. Provide a clear description of what changed and why.

Keep pull requests focused on a specific feature, improvement or bug fix.

## 7. License

By contributing to OnePlugin, you agree that your contributions will be distributed under the project's **GNU General Public License v3.0 (GPL-3.0)**.

Please ensure that you have the right to submit the code, assets or other materials you contribute.

See the `LICENSE` file for the complete licence terms.

---

Thank you for helping make OnePlugin better!
