# VinVenture Branching Strategy

## Overview

VinVenture uses **GitHub Flow** - a lightweight, branch-based workflow designed around continuous deployment. This strategy encourages frequent check-ins to main and ensures the main branch is always deployable.

## Branch Structure

### Main Branch (`main`)
- **Purpose**: Production-ready, always deployable code
- **Protection**: Protected with required status checks and reviews
- **Deployment**: Automatically deploys to production when changes are merged
- **Lifecycle**: Long-lived, permanent branch

### Feature Branches
- **Naming Convention**: `feature/description` or `fix/description`
- **Examples**: 
  - `feature/user-authentication`
  - `fix/payment-processing-bug`
  - `feature/winery-search-filters`
- **Lifecycle**: Short-lived, deleted after merge
- **Purpose**: Isolated development of new features or bug fixes

## Workflow Process

### 1. Create Feature Branch
```bash
# Start from latest main
git checkout main
git pull origin main

# Create and switch to feature branch
git checkout -b feature/your-feature-name
```

### 2. Development
- Make frequent, small commits with clear messages
- Push changes regularly to keep the branch up-to-date
- Use conventional commit messages when possible

### 3. Create Pull Request
- Open PR when feature is complete and tested
- Use the provided PR template
- Request reviews from team members
- Ensure all CI checks pass

### 4. Review and Merge
- Address review feedback
- Rebase on main if needed
- Merge using "Squash and merge" or "Rebase and merge"
- Delete feature branch after merge

### 5. Automatic Deployment
- Main branch automatically deploys to production
- Feature branches get preview deployments for testing

## Branch Protection Rules

The main branch is protected with the following rules:

### Required Status Checks
- ✅ All CI tests must pass
- ✅ Security scans must pass
- ✅ Code coverage requirements met
- ✅ No merge conflicts

### Required Reviews
- ✅ At least 1 approval from code owners
- ✅ No reviews from PR author
- ✅ Dismiss stale reviews when new commits are pushed

### Additional Rules
- ✅ Require branches to be up to date before merging
- ✅ Require linear history (no merge commits)
- ✅ Restrict pushes to main (only via PR)
- ✅ Allow force pushes only by administrators

## Commit Message Convention

We use conventional commits for better automation and changelog generation:

```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```
feat(auth): add OAuth2 integration with Google
fix(payment): resolve Stripe webhook validation issue
docs(api): update authentication endpoints documentation
refactor(ui): extract reusable button component
```

## CI/CD Pipeline

### Feature Branch Workflow
1. **Push to feature branch** → Triggers CI pipeline
2. **Run tests** → Unit, integration, and e2e tests
3. **Security scan** → Dependency and code vulnerability checks
4. **Build artifacts** → Frontend and backend builds
5. **Deploy preview** → Staging environment for testing

### Main Branch Workflow
1. **Merge to main** → Triggers production deployment
2. **Run full CI** → All tests and security checks
3. **Deploy to production** → Automatic deployment to AWS
4. **Run smoke tests** → Post-deployment verification
5. **Notify team** → Success/failure notifications

## Best Practices

### Do's ✅
- Keep feature branches small and focused
- Make frequent commits with clear messages
- Test thoroughly before creating PR
- Keep main branch always deployable
- Use descriptive branch and commit names
- Rebase feature branches on main regularly
- Delete merged feature branches

### Don'ts ❌
- Don't commit directly to main
- Don't merge broken code
- Don't create long-lived feature branches
- Don't skip code reviews
- Don't ignore CI failures
- Don't force push to main
- Don't leave feature branches unmerged for weeks

## Emergency Hotfixes

For critical production issues:

1. **Create hotfix branch** from main
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-issue-description
   ```

2. **Make minimal fix** with focused changes
3. **Test thoroughly** in staging environment
4. **Fast-track review** with team notification
5. **Merge and deploy** immediately
6. **Create follow-up issue** for proper testing/refactoring

## Environment Strategy

- **Feature Branches** → Preview deployments (staging)
- **Main Branch** → Production deployment
- **Hotfix Branches** → Direct to production (with approval)

## Monitoring and Alerts

- **Deployment Status**: Slack notifications for all deployments
- **Failed Builds**: Immediate alerts to development team
- **Security Issues**: Critical alerts to security team
- **Performance**: Monitoring for deployment impact

## Tools and Integrations

- **GitHub**: Repository hosting and PR management
- **GitHub Actions**: CI/CD pipeline automation
- **AWS**: Production and staging environments
- **Slack**: Team notifications and alerts
- **CodeQL**: Security scanning and analysis

## Getting Started

1. **Clone repository**
   ```bash
   git clone https://github.com/your-org/vinventure.git
   cd vinventure
   ```

2. **Set up development environment**
   ```bash
   pnpm install
   pnpm run dev
   ```

3. **Create your first feature branch**
   ```bash
   git checkout -b feature/my-first-feature
   ```

4. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: add my first feature"
   git push origin feature/my-first-feature
   ```

5. **Create pull request** via GitHub web interface

## Questions?

If you have questions about this branching strategy, please:
- Check the [GitHub Flow documentation](https://guides.github.com/introduction/flow/)
- Ask in the team Slack channel
- Create an issue for clarification
