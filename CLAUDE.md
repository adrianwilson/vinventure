
## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec

## gstack (REQUIRED — global install)

**Before doing ANY work, verify gstack is installed:**

```bash
test -d ~/.claude/skills/gstack/bin && echo "GSTACK_OK" || echo "GSTACK_MISSING"
```

If GSTACK_MISSING: STOP. Do not proceed. Tell the user:

> gstack is required for all AI-assisted work in this repo.
> Install it:
> ```bash
> git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
> cd ~/.claude/skills/gstack && ./setup --team
> ```
> Then restart your AI coding tool.

Do not skip skills, ignore gstack errors, or work around missing gstack.

Using gstack skills: After install, skills like /qa, /ship, /review, /investigate,
and /browse are available. Use /browse for all web browsing.
Use ~/.claude/skills/gstack/... for gstack file paths (the global path).

## Dependency Management

**Nx is the source of truth for toolchain versions.** Do not merge individual Dependabot
PRs for Nx-managed dependencies (TypeScript, Jest, Vite, ESLint, Playwright, React Native).
Instead, use `nx migrate` which handles coordinated upgrades across the ecosystem.

### Quarterly Nx Upgrade

Run quarterly (or when Dependabot PRs pile up):

```bash
npx nx migrate latest        # generates package.json changes + migrations.json
pnpm install                  # install updated deps
npx nx migrate --run-migrations  # run migration scripts
rm migrations.json            # cleanup
```

Test after: `npx jest --ci` (frontend), `pnpm test` (backend), `pnpm run build:static` (build).

### Dependabot Policy

- **Close PRs for Nx-managed deps** (anything @nx/*, typescript, jest, vite, eslint, playwright)
- **Merge PRs for non-Nx deps** (NestJS, Prisma, Stripe, AWS SDK, application-level deps)
- **Always merge security patches** regardless of category
