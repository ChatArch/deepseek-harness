# Issue Draft: Support Multi-User Session/Workspace Ownership For Web Deployments

Tracking issue: https://github.com/ChatArch/deepseek-harness/issues/1

Official upstream note: `deepseek-ai/deepseek-harness` currently has GitHub Issues disabled, so this was opened on the ChatArch fork and kept upstream-safe for later reposting as an issue/discussion.

## Title

Support multi-user session/workspace ownership for Web deployments

## Body

### Context

DeepSeek Harness can be served as a Web UI and already has important browser request trust checks (loopback/trusted-host, Origin/Host fences, privileged-method pinning). Those checks protect the host boundary, but they are explicitly not a user authentication or per-user data isolation model.

For Web deployments behind an auth gateway, reverse proxy, SSO, or an Open WebUI-like front door, the host can know which user is making a request, but DSH currently still treats session and workspace state as a single global user space.

### Problem

In a multi-user Web deployment, the first product-level need is not necessarily OS/container sandboxing. It is usually data separation for the Web experience:

- each user should see only their own conversation/session history;
- each user should see only their own workspace/project history;
- new sessions should default to that user's workspace root;
- workspace mutations should not affect another user's project list;
- admin users should have a well-defined bypass/repair view;
- auth-disabled local mode should keep today's single-user behavior.

Today, a shared Web host has global state for things like:

- session list/search/history/export;
- workspace registry/list/mutations;
- workspace-to-session membership;
- event streams and session projection caches.

This means multiple authenticated users of the same Web deployment can have crossed conversation and project history unless the deployment runs separate DSH instances per user.

### Proposed MVP

Add an optional application-level ownership model for Web deployments, staged separately from any stronger sandbox/runtime isolation work.

1. **Request identity context**
   - Define a request-local identity shape available to host-side API handlers.
   - Support a trusted reverse-proxy/header mode for deployments where authentication is handled by the front door.
   - Keep it disabled by default.

2. **Session ownership**
   - Record an owner for newly created sessions (`ownerUserId` or equivalent metadata/side index).
   - Filter `session.list` and `session.search` by current user.
   - Enforce owner checks for `session.history`, `session.export`, `session.rename`, `session.fork`, `session.prompt`, queue updates, cancellation, etc.
   - Make forked/subagent sessions inherit the parent owner.
   - Decide how SSE/event streams should filter frames for the current user.

3. **Workspace ownership**
   - Record an owner for workspace records.
   - Filter `workspace.list` by current user.
   - Enforce owner checks for create/rename/delete/reorder/archive/insert-session operations.
   - New users should get a deterministic default workspace root (for example under a deployment-configured `users/<safe-user-id>/` root).
   - Workspace-to-session membership should not cross owners.

4. **Admin and legacy behavior**
   - Admins may list/manage all users' sessions/workspaces or enter an explicit admin view.
   - Legacy unowned sessions/workspaces should have a clear migration policy: admin-visible, claim-on-first-use, or assigned to a configured bootstrap admin.
   - Auth-disabled mode should preserve current behavior and avoid requiring ownership fields.

5. **Policy table for privileged APIs**
   - Define which API methods are user-owned, admin-only, or local-only.
   - Keep credentials/settings/host filesystem helpers conservative by default.

### Non-goals for the first PRs

- Strong OS-user, container, namespace, or VM sandboxing per user.
- Full enterprise IAM/team sharing/RBAC.
- Copying auth implementation code from another project.
- Weakening the existing Host/Origin/trusted-host security checks.

Runtime isolation may still be a valid deployment strategy, but this issue is about the smaller upstreamable data ownership model needed for conversation/project-history isolation.

### Suggested PR shape

This could land as several small PRs:

1. Request-local auth/user context plumbing, no behavior change by default.
2. Optional trusted-header resolver for authenticated reverse-proxy deployments.
3. Session owner metadata/side-index plus list/history/search/export filtering.
4. Workspace owner metadata plus workspace list/mutation filtering.
5. Admin/legacy migration policy and frontend affordances.

### Questions for maintainers

- Should ownership metadata live directly in session/workspace records, or in a separate auth/ownership domain to avoid changing existing records?
- What should happen to legacy unowned sessions and workspaces?
- Should admin bypass be part of the API layer from the start, or deferred until an admin UI exists?
- Should the first implementation focus on trusted-header deployments, local login, or both?
- Is a per-user default workspace root in scope for DSH itself, or should deployments supply it externally?
