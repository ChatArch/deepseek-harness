# DeepSeek Harness Auth / Multi-User Seams

Date: 2026-08-21
Branch: `dev`
Base: `528c682e06` / `dsh-v0.1.1-rc.1`

## Goal

Bring an Open WebUI-style multi-user authentication and ownership system into DeepSeek Harness, developed on the ChatArch fork before upstream PRs.

## Existing DSH Boundaries

- `packages/client/connection/src/api-request-trust.ts` is only a browser trust fence. It explicitly says it is not authentication.
- `packages/host/webserver/src/index.ts` is a generic `node:http` route registry with no user concept.
- `packages/client/connection/src/rpc-host.ts` validates Host/Origin trust and bridges `/api` to the API proxy.
- `packages/host/apiproxy/src/fetch/handler.ts` maps HTTP requests to typed API methods.
- `packages/host/apiproxy/src/api-proxy.ts` implements sessions, workspaces, settings, credentials, host operations and streams.
- `packages/core/session/src/types.ts` persists `SessionHeader` with no owner field.
- `packages/workspace/workspace` persists global workspace records with no owner field.
- `packages/session-query/session-query-sqlite` indexes sessions globally with no owner column.

## First Code Slice

Add an API request context seam:

- Define `ApiAuthIdentity` and `ApiRequestContext`.
- Add optional `context` to host-side `RpcRequest<P>`.
- Let `toFetchHandler(api, { resolveContext })` attach context to:
  - unary POST `/api/<method>` calls,
  - SSE GET `/api/events.mux`,
  - SSE GET `/api/events.host`,
  - GET/HEAD `/api/session.export`,
  - POST `/api/respond`.
- Keep default behavior unchanged when no resolver is configured.

This is the minimal prerequisite for local login, Open WebUI trusted-header bridging, and later ownership checks.

## Next Seams After This Slice

1. Auth service package
   - Local first-admin bootstrap.
   - Password hash storage.
   - Cookie/token creation and verification.
   - Optional trusted-header / Open WebUI bridge resolver.

2. Session owner metadata
   - Add owner to session header or a durable side index.
   - Filter `session.list/search/history/export`.
   - Enforce owner on prompt/fork/rename/cancel/updateQueue/attachment.
   - Inherit owner for subagents and forks.

3. Workspace owner metadata
   - Add owner to workspace records or a side index.
   - Filter workspace list/events.
   - Enforce owner on workspace mutations.

4. Privileged surface policy
   - Protect `credentials.*`, writable `settings.*`, host filesystem operations, and preset authoring.
   - Admin can manage deployment-level state; normal users should not see/change global credentials.

5. UI integration
   - Add login/bootstrap/logout UI.
   - Add user menu and admin/users page.
   - Preserve current single-user UX when auth is disabled.

## Open WebUI Concepts To Borrow

- First registered user becomes admin.
- Current-user resolver before business logic.
- Separate user/admin gates.
- User table + auth table separation.
- Group/access-grant model later, after strict owner-only MVP.
- Reverse-proxy friendly deployment mode.

## Compatibility Stance

- Default `auth.mode` should be disabled for upstream compatibility until maintainers accept mandatory rules.
- If auth is enabled, unowned legacy sessions must have an explicit policy: admin-only, one-time claim, or migration command.
- Non-loopback serving should warn or require auth in a later hardening PR.
