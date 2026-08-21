# Task: Bring Open WebUI-Style Multi-User Auth Into DSH

Date: 2026-08-21
Branch: `dev`
Remote: `origin` = `https://github.com/ChatArch/deepseek-harness.git`

## Objective

Implement a multi-user authentication and data-isolation system in DeepSeek Harness, using our live Glance/Open WebUI deployment as the reference system and codebase to study.

## Reference System

- Glance service: `webui` / `Open WebUI`.
- URL: `https://webui.public.wzhecnu.cn/`.
- Docker compose: `/home/zhihong/.chatarch/open-webui/docker-compose.yaml`.
- Data: `/home/zhihong/.chatarch/open-webui/data`.
- Source/image: `ghcr.io/open-webui/open-webui:main`, source label `open-webui/open-webui`.

## Development Rule

Develop only on the ChatArch fork branch `dev`. Do not push this work to upstream directly. Use upstream only as the sync base.

## Phase 0: Dev Branch And Seam

Status: in progress.

Deliverables:

- Create/push `origin/dev` from current master.
- Add request context seam to API carrier.
- Test that carrier-resolved context reaches unary calls, SSE streams, session export and response routes.

## Phase 1: Local Auth Service

Deliverables:

- Add `auth.mode` config shape: `disabled | local | trusted-header`.
- Add user/auth storage abstraction.
- Add first-admin bootstrap.
- Add password hash verification.
- Add login/logout/me APIs.
- Add cookie/token session resolver.

Borrow from Open WebUI:

- user/auth table split,
- first user bootstrap,
- current-user helper,
- admin gate helper.

Do not copy Open WebUI code verbatim without license review.

## Phase 2: Session Ownership

Deliverables:

- Persist owner on DSH sessions or a durable side index.
- Filter and enforce ownership for session APIs.
- Ensure `session.search` and `session.export` cannot cross user boundaries.
- Make subagents/forks inherit parent owner.
- Filter `/api/events.mux` per current user.

## Phase 3: Workspace Ownership

Deliverables:

- Persist owner on workspaces or side index.
- Filter and enforce workspace APIs.
- Filter host workspace events.
- Define admin repair/migration behavior.

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

Deliverables:

- Trusted-header or token bridge for deployments where Open WebUI is the front door.
- Map Open WebUI user id/email/role into DSH `ApiAuthIdentity`.
- Fail closed when bridge headers are missing or untrusted.

## Acceptance Criteria

- A DSH web deployment can run with auth enabled.
- Two users cannot see or act on each other's sessions/workspaces.
- Admin can manage users and deployment-level settings.
- Current local single-user flow still works with auth disabled.
- Tests cover carrier context, login, owner filtering, SSE filtering and privileged routes.
