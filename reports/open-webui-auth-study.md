# Open WebUI Auth Study for DSH Integration

Date: 2026-08-21

## Source Of Truth

The reference multi-user system is the Open WebUI service already listed in our Glance dashboard, not a hypothetical external UI.

Current deployment facts from `zhihong.oray`:

- Glance service item: `webui` / `Open WebUI`.
- Public entry: `https://webui.public.wzhecnu.cn/`.
- Local Docker container: `open-webui`.
- Image: `ghcr.io/open-webui/open-webui:main`.
- Image source label: `https://github.com/open-webui/open-webui`.
- Compose file: `/home/zhihong/.chatarch/open-webui/docker-compose.yaml`.
- Data directory: `/home/zhihong/.chatarch/open-webui/data`.
- Port mapping: `127.0.0.1:3080 -> 8080/tcp`.
- Smoke check: `https://webui.public.wzhecnu.cn/` returns HTTP 200 with title `Open WebUI`.

The compose file references an `.env` file; do not print or commit those values.

## Current Data/Auth State

The live Open WebUI SQLite DB at `/home/zhihong/.chatarch/open-webui/data/webui.db` contains these relevant tables:

- `user`
- `auth`
- `api_key`
- `chat`
- `folder`
- `group`
- `group_member`
- `access_grant`
- `model`
- `tool`
- `knowledge`
- `file`
- `memory`

Observed counts, with secrets omitted:

- `user_count = 2`
- `auth_count = 2`
- `user_roles = [('admin', 2)]`

Relevant user columns include:

- `id`, `name`, `email`, `role`, `profile_image_url`
- `created_at`, `updated_at`, `last_active_at`
- `username`, `settings`, `oauth`, `info`, `scim`

## Code Patterns To Borrow Conceptually

Open WebUI's backend implements the web-app pattern we want DSH to support:

1. User/auth tables
   - Users have stable ids, profile fields, role and status data.
   - Auth records store login identity and password material.

2. Session token layer
   - A login route creates a token/cookie.
   - Request helpers resolve the current user before business routes run.

3. Role gates
   - Regular user vs admin checks are separated.
   - Admin APIs are guarded centrally.

4. Data ownership
   - Chats, folders, tools/knowledge access and other app data are scoped through user/group/access tables.

5. Reverse-proxy compatibility
   - Open WebUI supports self-hosted operation and can live behind our existing public/local ingress.

## How This Maps To DeepSeek Harness

DSH should not copy Open WebUI's whole product model. DSH has different domain objects:

- DSH sessions ~= Open WebUI chats, but DSH sessions also carry tool execution and local cwd metadata.
- DSH workspaces ~= grouped project/session roots.
- DSH credentials/settings are deployment-sensitive and higher risk than normal chat preferences.
- DSH host filesystem helpers can open/list/create paths and must be privileged.

Therefore the integration plan is to re-implement an Open WebUI-inspired auth/user/role model in DSH, while optionally allowing an Open WebUI bridge source later.

## Immediate Design Decision

Use Open WebUI as the reference implementation for the user system, but develop in `ChatArch/deepseek-harness` on branch `dev`.

The first DSH code slice is not a login UI. It is the request-context seam that lets the HTTP carrier attach a resolved user identity to every API call, SSE stream and session export. Without that seam, there is nowhere safe to enforce ownership in DSH business logic.
