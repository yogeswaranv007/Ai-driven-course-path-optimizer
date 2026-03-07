# Contributing to Learning Path Optimizer

Thank you for your interest in contributing! This document outlines our development standards and workflows.

---

## 🌿 Branch Naming Convention

Use the following prefixes:

- `feat/` - New features (e.g., `feat/google-oauth`, `feat/skill-gap-chart`)
- `fix/` - Bug fixes (e.g., `fix/auth-cookie-not-set`, `fix/plan-generation-error`)
- `chore/` - Maintenance tasks (e.g., `chore/update-deps`, `chore/eslint-config`)
- `docs/` - Documentation updates (e.g., `docs/api-contract`, `docs/readme-update`)
- `refactor/` - Code refactoring (e.g., `refactor/plan-service`, `refactor/auth-middleware`)
- `test/` - Test-related changes (e.g., `test/auth-endpoints`, `test/plan-generator`)

**Example**:

```bash
git checkout -b feat/progress-tracking
```

---

## 📝 Commit Message Format (Conventional Commits)

Follow this structure:

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, no logic change)
- `refactor` - Code refactoring
- `test` - Adding/updating tests
- `chore` - Maintenance (deps, config, build)

### Examples

```
feat(auth): add Google OAuth login

Implemented Passport.js Google strategy with secure cookie handling.
Closes #12
```

```
fix(plan): resolve skill gap calculation error

The gap score formula was not accounting for marks properly.
Now uses weighted average as per design doc.
```

```
docs(api): update API contract with new endpoints

Added documentation for PATCH /plans/:id/task/:taskId
```

**Note**: Husky will validate your commit messages automatically.

---

## 🔄 Pull Request Workflow

### Before Opening a PR

1. **Pull latest changes**:

   ```bash
   git checkout main
   git pull origin main
   git checkout your-branch
   git rebase main
   ```

2. **Run checks locally**:

   ```bash
   npm run lint
   npm run format:check
   npm test
   ```

3. **Test manually**:
   - Frontend: Test UI changes in browser
   - Backend: Test API endpoints with Postman/Thunder Client

### Opening a PR

- Use the PR template (auto-populated)
- Link related issues (e.g., "Closes #42")
- Add screenshots/videos for UI changes
- Keep PRs **small and focused** (< 400 lines changed)

### PR Review Checklist

- [ ] Code follows ESLint rules
- [ ] No console.logs in production code
- [ ] Environment variables use config files (not hardcoded)
- [ ] API inputs are validated with Zod
- [ ] Error handling is present
- [ ] No sensitive data in commits
- [ ] Tests pass (if applicable)

---

## 🧪 Testing Guidelines

### Manual Testing

- Test all API endpoints with valid/invalid inputs
- Test auth flows (login, logout, protected routes)
- Test edge cases (empty inputs, long strings, etc.)

### Automated Testing (Future)

- Unit tests for services/utils
- Integration tests for API routes
- E2E tests for critical user flows

---

## 📦 Release Process

### Versioning (Semantic Versioning)

- `v1.0.0` - MVP release
- `v1.1.0` - Minor feature additions
- `v1.1.1` - Bug fixes

### Creating a Release

1. Update version in `package.json` files
2. Update CHANGELOG.md
3. Create a git tag:
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0 - MVP"
   git push origin v1.0.0
   ```

---

## 🎯 Milestones (30-Day Plan)

### Week 1: Foundation

- [x] Repo setup + monorepo structure
- [ ] Auth (email/password + Google OAuth)
- [ ] Database models + MongoDB connection
- [ ] Base UI (landing, login, register)

### Week 2: Core Features

- [ ] Profile management (skills, marks, interests)
- [ ] Plan generation logic (rule-based algorithm)
- [ ] Save/retrieve plans
- [ ] API endpoints + validation

### Week 3: Progress Tracking

- [ ] Mark tasks as complete
- [ ] Skill gap chart (Recharts)
- [ ] Plan history page
- [ ] UI polish + responsive design

### Week 4: Polish & Deploy

- [ ] AI service integration (optional)
- [ ] Deploy to Render + Vercel
- [ ] Testing + bug fixes
- [ ] README with screenshots
- [ ] Demo video (2 mins)

---

## 🛠️ Code Style

### JavaScript/JSX

- Use ES6+ syntax (arrow functions, destructuring, etc.)
- Use `const` over `let` when possible
- Avoid `var`
- Use async/await over raw Promises
- Prefer named exports over default exports

### File Naming

- Components: `PascalCase.jsx` (e.g., `Navbar.jsx`)
- Utilities: `camelCase.js` (e.g., `logger.js`)
- Routes: `camelCase.routes.js` (e.g., `auth.routes.js`)

### Folder Structure

- Group by feature/domain (not by type)
- Keep related files close together

---

## 🚨 Common Pitfalls

1. **Don't commit `.env` files** - Use `.env.example` instead
2. **Don't hardcode secrets** - Use `process.env.VAR_NAME`
3. **Don't skip validation** - Always validate API inputs with Zod
4. **Don't use `localStorage` for tokens** - Use httpOnly cookies
5. **Don't push directly to `main`** - Always create a branch + PR

---

## 📚 Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Git Best Practices](https://www.git-scm.com/book/en/v2)

---

## 💬 Questions?

Open an issue or reach out to the maintainer:

- **Email**: yogeswaranv007@gmail.com
- **GitHub**: [@yogeswaranv007](https://github.com/yogeswaranv007)

---

**Thank you for contributing! 🎉**
