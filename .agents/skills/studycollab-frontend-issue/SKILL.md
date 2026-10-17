---
name: studycollab-frontend-issue
description: Execute StudyCollab frontend audit issues by audit ID (such as FE-001) or GitHub issue number. Investigate the issue, implement the fix, add regression tests, run validation, and report results. Use whenever the user asks to complete, fix, or implement a frontend audit issue.
---

# StudyCollab Frontend Issue Execution

## Purpose

Execute one StudyCollab frontend issue end-to-end using a short instruction such as:

- `Complete FE-001`
- `Complete FE-004`
- `Complete GitHub issue #11`

The user should not need to provide the issue title, file paths, implementation plan, or test commands. Discover those details from the repository and GitHub.

The goal is to deliver a focused, maintainable, tested implementation ready for human review.

## 1. Mandatory Rules

1. Execute exactly one issue per request.
2. Resolve the requested audit ID to its actual GitHub issue before making code changes.
3. Never guess the mapping between audit IDs and GitHub issue numbers.
4. Stay on the user's current Git branch. Never switch, create, rename, or delete branches unless explicitly requested.
5. Preserve all existing user changes. Never reset, clean, stash, or overwrite unrelated work.
6. Read the issue description, acceptance criteria, and relevant comments before implementation.
7. Investigate the existing implementation and establish the root cause before editing.
8. Follow the existing frontend architecture and coding conventions.
9. Keep the work within the frontend scope. Do not modify backend code, database schemas, backend configuration, or API contracts.
10. Add or update relevant tests and run appropriate validation.
11. Never claim that tests, builds, linting, or other checks passed unless they were actually executed successfully.
12. Do not commit, push, create a pull request, or close the issue automatically.
13. Do not make unrelated refactors or modify unrelated files.
14. If a correct solution requires backend changes, missing requirements, destructive changes, or an unavailable dependency, explain the blocker and stop rather than inventing a workaround.

## 2. Resolve the Requested Issue

### When the user says `Complete FE-001`

Treat `FE-001` as the stable audit identifier, not as a GitHub issue number.

Resolve the mapping in this order:

1. Inspect the frontend audit mapping or tracking document in the repository, if one exists.
2. Search GitHub issues for the exact audit identifier, including titles and issue bodies.
3. Inspect matching issue titles, descriptions, and comments to confirm the match.
4. Confirm the issue belongs to the current StudyCollab repository.
5. Record the actual GitHub issue number and title.

Useful commands:

- `gh repo view`
- `gh issue list --state all --limit 100`
- `gh issue list --search "FE-001" --state all`
- `gh issue view <number> --comments`

Use GitHub CLI where available. If necessary, inspect repository documentation and GitHub issue metadata to establish the mapping.

Do not assume that FE-001 means GitHub issue #1.

If multiple issues match the same audit ID, or the mapping cannot be verified, stop and ask the user which issue they intend. Do not modify code based on a guess.

### When the user specifies `Complete GitHub issue #11`

Use issue #11 directly, after verifying that it belongs to the current repository.

If the issue also contains an audit ID, preserve and report that identifier.

### Before implementation

Retrieve the complete issue details and comments. Identify:

- Audit ID, if available.
- Actual GitHub issue number.
- Exact title.
- Expected and actual behavior.
- Acceptance criteria.
- Affected frontend components and modules.
- Relevant API contracts and dependencies.
- Required tests.

## 3. Inspect the Repository

Before editing, run and inspect:

- `git status --short`
- `git branch --show-current`
- The relevant frontend directory structure.
- `package.json` scripts and dependencies.
- Existing test files and test framework.
- The relevant source files and their callers.
- Existing API clients, contexts, hooks, routing, and shared components.
- The current Git diff and uncommitted user changes.

Identify the root cause and choose the smallest complete fix.

Do not overwrite, revert, or reformat unrelated user changes.

## 4. Implementation Standards

### React and component architecture

- Keep components focused and reusable.
- Follow existing patterns for hooks, contexts, state, and component composition.
- Avoid duplicated state, duplicated API calls, and unnecessary prop drilling.
- Handle loading, success, empty, and error states when relevant.
- Clean up effects, subscriptions, and event listeners appropriately.
- Avoid unnecessary re-renders and effects that duplicate derived state.

### API integration

- Reuse the existing configured Axios instance and API modules.
- Preserve configured base URLs, authentication headers, and interceptors.
- Do not introduce native `fetch` when the established API client should be used.
- Verify endpoint paths, payloads, response shapes, and authentication behavior against existing backend code or documented contracts.
- Never invent endpoints or silently change backend contracts.
- Handle failed requests and user feedback consistently.
- Prevent duplicate submissions and race conditions where relevant.

### Authentication and security

- Respect the existing authentication and session lifecycle.
- Handle unauthorized responses and expired sessions consistently.
- Never bypass authentication or authorization controls.
- Do not introduce insecure token storage.
- Avoid unsafe HTML rendering and injection vulnerabilities.
- Validate and encode user-controlled content appropriately for its rendering context.

### Forms and UI

- Validate user input appropriately.
- Preserve user-entered data when recoverable errors occur.
- Use semantic HTML and accessible labels.
- Support keyboard interaction for relevant controls.
- Preserve the StudyCollab design language and responsive behavior.
- Avoid unrelated redesigns.

### Maintainability

- Reuse existing utilities and components where appropriate.
- Avoid unnecessary dependencies and abstractions.
- Remove dead code only when directly related to the issue.
- Keep changes focused and readable.
- Do not perform broad refactors unless required by the acceptance criteria.

## 5. Testing Requirements

Inspect the existing test setup before choosing commands or adding dependencies.

Write or update tests that verify the issue's acceptance criteria and prevent regressions.

Depending on the issue, cover:

- Component rendering and user interactions.
- Loading, success, empty, and error states.
- API requests, payloads, and error handling.
- Authentication behavior.
- Input validation and security-sensitive behavior.
- Regression scenarios for the reported bug.
- Accessibility-related behavior where appropriate.

Use the existing test framework and project conventions. Mock external APIs and isolate tests from live services where appropriate.

Do not change tests merely to make incorrect behavior pass.

If a test reveals a backend contract problem that cannot be resolved within the frontend, document the blocker.

## 6. Validation

Inspect the scripts available in `package.json`. Run the appropriate targeted tests first, followed by broader checks where practical.

Potential commands include:

- `npm test -- --run`
- `npm run lint`
- `npm run build`

These are examples only. Use the actual scripts supported by the project.

For every failed check:

1. Determine whether the change caused the failure.
2. Fix failures introduced by the implementation.
3. Distinguish pre-existing failures from new regressions.
4. Report checks that could not be run.
5. Never report skipped or failed checks as passing.

Review the final diff for correctness, security issues, accidental unrelated edits, debugging code, and missing tests.

## 7. GitHub Issue Management

### Audit IDs

Use the stable identifiers:

- `FE-001`
- `FE-002`
- `FE-003`

Preserve the existing ID. Never invent or renumber audit IDs.

### GitHub issue numbers

GitHub issue numbers, such as `#11` or `#24`, are separate from audit IDs.

Always report the verified mapping, for example:

`[FE-001] — GitHub issue #11: Secure PDF export against HTML injection`

Never guess issue numbers.

### Labels and assignees

Inspect the issue's existing labels and assignee. Preserve them unless a change is necessary and authorized.

Do not create labels, modify assignees, or change repository-wide settings automatically.

### Issue closure

Do not close the issue after implementation. The user reviews the changes and manages the pull request and issue lifecycle.

When reporting completion, indicate that the issue is ready for review only if its acceptance criteria and validation requirements have been satisfied.

## 8. Final Report

After implementation and validation, report:

### Issue
- Audit ID.
- Verified GitHub issue number and title.

### Root cause
Explain the underlying problem concisely.

### Implementation
Describe the fix and why it addresses the issue.

### Files changed
List each relevant file and the purpose of its changes.

### Tests
Describe tests added or updated and the scenarios covered.

### Validation
List commands executed and their actual results. Separate passed, failed, and not-run checks.

### Remaining concerns
Identify blockers, backend dependencies, unverified behavior, and outstanding acceptance criteria.

### Git status
Report the current branch and whether changes remain uncommitted.

Stop after reporting the results. Wait for the user's review before committing, pushing, creating a pull request, or closing the issue.

## Definition of Done

An issue is ready for review when:

- The requested issue has been verified.
- Its acceptance criteria have been implemented or explicitly identified as blocked.
- The root cause has been addressed.
- Relevant regression tests have been added or updated.
- Applicable checks have been executed and reported honestly.
- The final diff has been reviewed.
- Unrelated user changes have been preserved.
- No commit, push, pull request, or issue closure has been performed automatically.

The objective is to deliver a focused, secure, maintainable, tested frontend fix—not merely a UI change that appears to work.