
$issues = @(
    @{
        Id = "FE-001"
        Title = "FE-001: Secure PDF export against HTML injection"
        Body = @'
## Problem
The audit identified potentially unsafe insertion of `editorTitle` into HTML using `document.write()` in `useNotesEditor.js`.

## Tasks
- Verify whether user-controlled content can cause XSS.
- Safely render or escape the title.
- Handle blocked popups and null window references.
- Add regression tests.

## Acceptance criteria
- User content cannot inject executable HTML or JavaScript.
- Blocked popups are handled gracefully.
- Relevant tests pass.
'@
    },
    @{
        Id = "FE-002"
        Title = "FE-002: Fix authentication refresh and session handling"
        Body = @'
## Problem
The audit reports that token refresh is not connected to the Axios response workflow and authentication state is handled inconsistently.

## Tasks
- Verify the backend refresh-token contract.
- Centralize authentication state.
- Handle expired tokens, failed refreshes, and concurrent 401 responses.
- Test logout and session expiration.

## Acceptance criteria
- Expired sessions are handled reliably.
- Refresh failures do not cause infinite retry loops.
- Authentication state remains consistent.
'@
    },
    @{
        Id = "FE-003"
        Title = "FE-003: Unify group state management"
        Body = @'
## Problem
`GroupContext.jsx` and `Dashboard.jsx` reportedly maintain duplicate group state and issue duplicate requests.

## Tasks
- Identify the source of truth for groups and active-group selection.
- Remove duplicated state and fetching.
- Preserve group creation, deletion, switching, and membership workflows.
- Add regression tests.

## Acceptance criteria
- Group state stays synchronized across the application.
- Redundant requests are eliminated where possible.
- Existing group workflows continue to work.
'@
    },
    @{
        Id = "FE-004"
        Title = "FE-004: Fix invite-code regeneration API integration"
        Body = @'
## Problem
`InviteLinkCard.jsx` reportedly uses native `fetch()` instead of the configured Axios client.

## Tasks
- Verify the backend endpoint and HTTP method.
- Add the operation to `groupApi.js`.
- Reuse configured base URL and authentication handling.
- Handle API errors and test regeneration.

## Acceptance criteria
- Requests target the correct backend endpoint.
- Authentication and error handling work consistently.
- Invite regeneration works in development and production configurations.
'@
    },
    @{
        Id = "FE-005"
        Title = "FE-005: Clarify and isolate incomplete chat functionality"
        Body = @'
## Problem
The audit reports chat components that are not connected to a working backend feature.

## Tasks
- Inventory existing chat components and routes.
- Confirm which components are used.
- Clearly distinguish implemented functionality from placeholders.
- Remove or isolate genuinely unused code without deleting planned work unnecessarily.

## Acceptance criteria
- No misleading or broken chat interactions are exposed.
- Unused code and future work are clearly documented.
'@
    },
    @{
        Id = "FE-006"
        Title = "FE-006: Resolve frontend ESLint violations"
        Body = @'
## Problem
The audit reports 21 ESLint errors and 2 warnings.

## Tasks
- Run the current lint command and record the actual findings.
- Fix violations without suppressing rules unnecessarily.
- Review React effect dependencies and context exports.
- Re-run lint and the production build.

## Acceptance criteria
- ESLint passes without unexplained suppressions.
- Existing functionality remains intact.
'@
    },
    @{
        Id = "FE-007"
        Title = "FE-007: Improve route loading and remove internal test routes from production"
        Body = @'
## Problem
The audit reports a large initial JavaScript bundle and test routes included in production.

## Tasks
- Verify the production bundle and route exposure.
- Add route-level lazy loading where beneficial.
- Ensure internal test pages are excluded from production.
- Measure the resulting build.

## Acceptance criteria
- Internal test routes are not exposed in production.
- Route loading works correctly.
- Bundle changes are measured and documented.
'@
    },
    @{
        Id = "FE-008"
        Title = "FE-008: Preserve unsaved note edits during updates"
        Body = @'
## Problem
The audit reports that changes to the selected-note reference may reset editor content and undo/redo history.

## Tasks
- Reproduce the issue.
- Separate note selection from background updates.
- Preserve dirty drafts or explicitly confirm destructive resets.
- Add regression tests.

## Acceptance criteria
- Background updates do not silently discard unsaved edits.
- Switching notes behaves predictably.
- Editor history remains consistent.
'@
    },
    @{
        Id = "FE-009"
        Title = "FE-009: Remove dead avatar events and simplify Sidebar props"
        Body = @'
## Problem
The audit reports an unhandled `avatarUpdated` event and excessive prop drilling into `Sidebar.jsx`.

## Tasks
- Verify whether any listener handles the avatar event.
- Replace the event with a reliable state-update mechanism if needed.
- Review Sidebar responsibilities and props.
- Reduce coupling without introducing unnecessary context dependencies.

## Acceptance criteria
- Avatar changes update the relevant UI reliably.
- Component interfaces remain clear and maintainable.
- Existing navigation and settings behavior is preserved.
'@
    },
    @{
        Id = "FE-010"
        Title = "FE-010: Improve frontend accessibility and remove unused stylesheets"
        Body = @'
## Problem
The audit reports clickable non-semantic elements and unused stylesheet placeholders.

## Tasks
- Verify interactive elements and keyboard accessibility.
- Prefer semantic buttons and appropriate labels.
- Check focus indicators and accessible names.
- Confirm stylesheet usage before removing dead files.

## Acceptance criteria
- Interactive controls support keyboard operation.
- Relevant accessibility checks pass.
- Unused stylesheets are removed only after confirming they are unnecessary.
'@
    },
    @{
        Id = "FE-011"
        Title = "FE-011: Establish automated frontend testing and CI"
        Body = @'
## Problem
The audit reports no automated unit, integration, or end-to-end test suite.

## Tasks
- Evaluate and configure Vitest and React Testing Library.
- Add tests for API utilities, authentication, groups, notes, and critical user workflows.
- Use MSW where useful for API mocking.
- Evaluate Playwright for end-to-end coverage.
- Add frontend checks to GitHub Actions.

## Acceptance criteria
- Tests run through documented package scripts.
- Critical functionality has automated regression coverage.
- CI runs relevant lint, test, and build checks.
'@
    }
)

foreach ($issue in $issues) {
    $existing = gh issue list --state all --search "$($issue.Id) in:title" --json title --jq '.[].title'

    if ($LASTEXITCODE -ne 0) {
        throw "Could not check existing issues. Stopping to avoid duplicates."
    }

    if ($existing -contains $issue.Title) {
        Write-Host "Skipping existing issue: $($issue.Title)" -ForegroundColor Yellow
        continue
    }

    Write-Host "Creating: $($issue.Title)" -ForegroundColor Cyan
    gh issue create --title $issue.Title --body $issue.Body

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Creation failed. Stopping here; rerun after investigating." -ForegroundColor Red
        break
    }
}
