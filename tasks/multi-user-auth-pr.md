# Task: Bring Open WebUI-Style Multi-User Auth Into DSH

Date: 2026-08-21
Branch: `dev`
Remote: `origin` = `https://github.com/ChatArch/deepseek-harness.git`

## Status

Paused/deferred as of 2026-08-21. Keep the deployment auth gate and trusted-header bridge as saved groundwork, but do not proactively implement DSH-native multi-user ownership until official direction is clearer.

Reason: DSH is not a pure chat app; it has filesystem, shell and workspace/environment capabilities. Without a strict runtime sandbox or per-user execution boundary, application-level session/workspace ownership would only isolate the UI/history layer and would not provide a true multi-user security boundary.

## Objective

Archived objective: product-level multi-user authentication and data ownership in DeepSeek Harness, using our live Glance/Open WebUI deployment as the reference system and codebase to study.

The previously scoped target was conversation/session history and workspace/project history isolation inside one DSH Web host process. This remains documented for future reference, but is not an active implementation plan.

## Reference System

- Glance service: `webui` / `Open WebUI`.
- URL: `https://webui.public.wzhecnu.cn/`.
- Docker compose: `/home/zhihong/.chatarch/open-webui/docker-compose.yaml`.
- Data: `/home/zhihong/.chatarch/open-webui/data`.
- Source/image: `ghcr.io/open-webui/open-webui:main`, source label `open-webui/open-webui`.

## Development Rule

Develop only on the ChatArch fork branch `dev`. Do not push this work to upstream directly. Use upstream only as the sync base.

## Accepted Deployment Model

The current accepted production stance is conservative:

- Keep DSH behind the deployment-level Open WebUI admin auth gate.
- Keep trusted-header context plumbing as saved groundwork.
- Do not advertise or rely on DSH-native multi-user isolation yet.
- Wait for official direction on runtime sandboxing, permission cross-sections and multi-user ownership before continuing local implementation.

The earlier application-level model remains a reference only:

- the DSH process may still run as a single OS user;
- filesystem/runtime access is not treated as a hard tenant boundary in the first phase;
- DSH must still know the authenticated Web user through `ApiRequestContext.auth`;
- session, workspace and project-history APIs must enforce application-level ownership;
- admin users need a clear bypass/repair path;
- auth-disabled mode keeps the existing single-user behavior.

## Phase 0: Dev Branch And Auth Context Seam

Status: complete.

Deliverables:

- Created and pushed `origin/dev` from current master.
- Added request context seam to API carrier.
- Tested that carrier-resolved context reaches unary calls, SSE streams, session export and response routes.

## Phase 1A: Open WebUI Trusted-Header Bridge

Status: complete and deployed to the acceptance environment.

Deliverables:

- Added `ConnectionConfig.trustedHeaderAuth` to the Web connection layer.
- Added `createTrustedHeaderAuthResolver()` for trusted reverse-proxy headers.
- Mapped verified `x-dsh-auth-*` headers into DSH `ApiRequestContext.auth`.
- Kept the bridge disabled by default; `DSH_AUTH_TRUSTED_HEADER=1` enables it in the Web bundle.
- Hardened the acceptance auth gate so it strips caller-provided auth headers and injects verified Open WebUI admin identity.
- Deployed `origin/dev` commit `d13356a5cc` to `hitk.cube` and verified `rexwzh@lookeng.cn` reaches DSH as `role=admin`, `source=open-webui`.

## Phase 1B: Auth Mode And User Projection

Status: deferred pending official direction.

Deliverables kept for reference:

- Add `auth.mode` config shape: `disabled | local | trusted-header`.
- Keep trusted-header mode as the deployment-first path because Open WebUI already owns login for our acceptance environment.
- Add user/auth storage abstraction only where needed for local mode and future admin UI.
- Add first-admin bootstrap, password hash verification, login/logout/me APIs, and cookie/token session resolver for local mode.
- Expose a stable current-user projection for UI and policy checks.

Borrow from Open WebUI:

- user/auth table split,
- first user bootstrap,
- current-user helper,
- admin gate helper.

Do not copy Open WebUI code verbatim without license review.

## Phase 2: Session Ownership

Status: deferred pending official direction and a stronger runtime/security boundary.

Deliverables kept for reference:

- Persist owner on DSH sessions or a durable side index keyed by `SessionId`.
- New `session.create` writes owner from `request.context.auth.userId`; auth-disabled mode writes no owner and preserves current behavior.
- Filter and enforce ownership for `session.list`, `session.search`, `session.history`, `session.export`, `session.rename`, `session.fork`, `session.prompt`, `session.updateQueue`, and `session.cancel`.
- Make subagents/forks inherit parent owner.
- Filter `/api/events.mux` per current user.
- Admin users may list/manage all sessions through an explicit admin policy path.
- Legacy unowned sessions are admin-visible by default, with a future migration/claim path.

## Phase 3: Workspace And Project-History Ownership

Status: deferred pending official direction and a stronger runtime/security boundary.

Deliverables kept for reference:

- Persist owner on workspaces or a durable side index keyed by `WorkspaceId`.
- Filter and enforce workspace APIs: list/create/rename/delete/reorder/archive/insert-session.
- Add per-user default workspace roots under a deployment-configured base, e.g. `<base>/<safe-user-id>/default`.
- New sessions created without an explicit workspace use the current user's default workspace root.
- Prevent workspace-to-session membership from crossing owners.
- Filter host workspace events by current user.
- Define admin repair/migration behavior for legacy unowned workspaces.

## Phase 4: Privileged Method Policy

Deliverables:

- Method policy table for user/admin/local-only routes.
- Admin-only defaults for credentials, writable settings, host filesystem helpers and preset authoring.
- Tests for policy refusal.

## Phase 5: UI

Deliverables:

- Login/bootstrap/logout UI.
- User menu.
- Admin user-management page.
- Auth-disabled mode preserves current UI.

## Phase 6: Open WebUI Bridge Mode

Status: first bridge complete; keep this phase for follow-up hardening.

Deliverables:

- Keep trusted-header bridge as the Open WebUI front-door deployment mode.
- Add issue/PR discussion based on `drafts/upstream-session-workspace-ownership-issue.md`; tracking issue is `https://github.com/ChatArch/deepseek-harness/issues/1` while official upstream Issues are disabled; official feedback comment is `https://github.com/deepseek-ai/deepseek-harness/discussions/3389#discussioncomment-18109728`.
- Add fail-closed behavior for authenticated deployments once DSH-native policy is enabled.
- Add UI current-user display/logout affordances for gateway-backed deployments.

## Acceptance Criteria

- A DSH web deployment can run with auth enabled.
- Two users cannot see or act on each other's sessions/workspaces.
- Admin can manage users and deployment-level settings.
- Current local single-user flow still works with auth disabled.
- Tests cover carrier context, login, owner filtering, SSE filtering and privileged routes.
