# Contributing to Stellar Wrap

Thank you for your interest in contributing to Stellar Wrap! This document outlines our contribution guidelines and best practices.

---

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 9.0.0

### Install pnpm

```bash
npm install -g pnpm@9
```

---

## 🔧 Package Manager

**This project uses pnpm exclusively.**

> **Why pnpm?**
> - Faster installs with content-addressable storage
> - Strict dependency isolation preventing phantom dependencies
> - Single source of truth via `pnpm-lock.yaml`
> - Industry-standard for modern frontend projects

### ✅ DO

```bash
# Install dependencies
pnpm install

# Add a dependency
pnpm add <package>

# Add a dev dependency
pnpm add -D <package>

# Update dependencies
pnpm update

# Run scripts
pnpm lint
pnpm build
pnpm dev
```

### ❌ DON'T

```bash
# ❌ Do NOT use npm
npm install
npm run build

# ❌ Do NOT use yarn
yarn install
yarn build
```

---

## 🔄 Git Workflow

### 1. Fork and Clone

```bash
git clone https://github.com/zintarh/stellar-wrap-frontend.git
cd stellar-wrap-frontend
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Create a Branch

Use conventional branch naming:

```bash
git checkout -b feat/my-feature
git checkout -b fix/issue-description
git checkout -b chore/dependency-update
```

### 4. Make Changes

- Write clear, focused commits
- Use the commit message format below
- Test your changes locally: `pnpm build && pnpm lint`

### 5. Commit with Conventional Format

This project uses **Conventional Commits** for structured history and automated versioning.

#### Format

```
<type>(<scope>): <short summary in present tense>

[optional body]

[optional footer(s)]
```

#### Types

- **feat**: new user-facing feature (UI, flow, interaction)
- **fix**: bug fix (visual, logic, or integration)
- **refactor**: code refactor that doesn't change behavior
- **style**: purely visual changes (spacing, colors, typography) with no behavior change
- **chore**: tooling, configs, dependency bumps, project plumbing
- **docs**: documentation only (README, comments)
- **test**: adding or updating tests only

#### Scopes (suggested)

- **landing**: landing hero, CTA, homepage
- **connect**: `/connect` page and wallet flow
- **loading**: `/loading` page and wrap animation
- **vibe-check**: `/vibe-check` page, vibes visualization
- **persona**: `/persona` archetype reveal
- **share**: `/share` page, share card and menus
- **store**: Zustand stores and state management
- **theme**: `globals.css`, Tailwind theme tokens
- **layout**: `app/layout.tsx`, root shell and providers
- **utils**: helpers and utility functions

#### Examples

```
feat(connect): add Freighter wallet support

- Integrate Freighter API
- Add network switching for mainnet/testnet
- Handle connection errors gracefully
```

```
fix(share): resolve card truncation on mobile

- Update ShareCard responsive padding
- Add text truncation for long usernames
- Test on 320px viewports
```

```
chore(deps): update tailwindcss to v4
```

### 6. Push and Create a PR

```bash
git push origin feat/my-feature
```

Then open a Pull Request on GitHub with a clear description of your changes.

---

## 🧪 Testing & QA

### Before Submitting a PR

1. **Run linting:**
   ```bash
   pnpm lint
   ```

2. **Build the project:**
   ```bash
   pnpm build
   ```

3. **Test locally:**
   ```bash
   pnpm dev
   # Open http://localhost:3000 and verify your changes
   ```

4. **Run tests (if applicable):**
   ```bash
   pnpm test
   ```

### Husky Pre-commit Hooks

This project uses Husky for automated checks before committing:

- **pre-commit**: Runs `pnpm lint`
- **pre-push**: Runs `pnpm build`
- **commit-msg**: Validates commit message format

These run automatically when you commit or push. They will reject commits/pushes that fail checks.

---

## 🚫 CI/CD Requirements

Your PR must pass all CI checks before merging:

1. **Lock file validation** ✅
   - `pnpm-lock.yaml` must be present and up-to-date
   - `package-lock.json` and `yarn.lock` must NOT exist

2. **Linting** ✅
   ```bash
   pnpm lint
   ```

3. **Build** ✅
   ```bash
   pnpm build
   ```

> **If CI fails on lock file checks:** You likely committed `package-lock.json` or `yarn.lock` by accident. Remove them and update `pnpm-lock.yaml`:
> ```bash
> rm -f package-lock.json yarn.lock
> pnpm install --frozen-lockfile
> git add pnpm-lock.yaml
> ```

---

## 📝 PR Description Template

When opening a PR, please include:

```markdown
## Description
Brief description of what this PR does.

## Related Issue
Closes #<issue-number>

## Changes
- Change 1
- Change 2

## Testing
How to test these changes locally.

## Screenshots (if applicable)
Attach screenshots for UI changes.
```

---

## 🎨 Code Standards

### TypeScript

- Use strict mode
- Avoid `any` types
- Export types properly

### React

- Use functional components
- Use React hooks (no class components)
- Memoize components when needed

### Tailwind CSS

- Use Tailwind utility classes
- Keep responsive breakpoints consistent
- Use CSS variables for custom colors

### File Organization

```
app/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── utils/              # Helper functions
├── services/           # API/business logic
├── store/              # Zustand stores
└── [routes]/           # Page routes
```

---

## 🐛 Reporting Bugs

Use GitHub Issues to report bugs. Include:

1. **Description**: What is the bug?
2. **Reproduction**: Step-by-step to reproduce
3. **Expected behavior**: What should happen?
4. **Actual behavior**: What actually happens?
5. **Environment**: Node version, browser, OS
6. **Screenshots**: If visual, attach screenshots

---

## 💡 Feature Requests

Use GitHub Issues for feature requests. Include:

1. **Description**: What feature?
2. **Use case**: Why is it needed?
3. **Proposed solution**: How could it work?
4. **Alternatives**: Other approaches?

---

## 🤝 Community

- Be respectful and inclusive
- Ask questions in Discussions or Issues
- Help review other PRs
- Share ideas and feedback constructively

---

## 📚 Resources

- [Stellar SDK Documentation](https://developers.stellar.org/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [pnpm Documentation](https://pnpm.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## ❓ Questions?

- Check existing GitHub Issues and Discussions
- Ask in the PR or open a new Discussion
- Reach out to maintainers

Thank you for contributing! 🚀
