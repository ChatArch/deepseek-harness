# Draft: Open WebUI-Style Multi-User Auth For DeepSeek Harness

## Title

Proposal: optional multi-user auth and per-user data isolation for DeepSeek Harness Web UI

## Context

DeepSeek Harness currently has a browser trust fence but not a user authentication system. Our deployment already runs Open WebUI as a separate multi-user web service, and its user/auth/admin/data-isolation model is a useful reference for DSH.

Relevant community discussions include requests for authentication, admin login, reverse-proxy auth and multi-user support.

## Proposal

Add auth in staged PRs:

1. Request-context seam, disabled by default.
   - Carrier resolves `ApiRequestContext`.
   - Business API methods can later read `request.context.auth`.
   - No behavior change with no resolver.

2. Local auth service.
   - First-admin bootstrap.
   - User/auth storage.
   - Password hash verification.
   - Cookie/token session resolver.
   - Login/logout/me APIs.

3. Session/workspace ownership.
   - Persist owner metadata.
   - Filter list/search/history/export/events.
   - Enforce owner on mutations.

4. Privileged method policy.
   - Admin-only credentials/settings/host filesystem/preset authoring.

5. Trusted-header/Open WebUI bridge mode.
   - Let reverse-proxy or Open WebUI front-door deployments pass authenticated user identity to DSH.

## Non-Goals

- Copying Open WebUI code directly.
- Full team sharing in the first owner-only MVP.
- Replacing the existing trusted-host fence.

## Maintainer Questions

- Should auth live in core packages or as an optional plugin?
- Should non-loopback serving require auth?
- Should legacy unowned sessions be admin-only, claimed, or migrated?
- Should normal users have personal model credentials, or should credentials remain deployment/admin scoped?
