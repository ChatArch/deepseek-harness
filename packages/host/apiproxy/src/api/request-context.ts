/**
 * Request-local metadata that does not ride the public RPC wire envelope.
 *
 * Auth integration layers resolve this at the carrier boundary (HTTP cookie,
 * Authorization header, or trusted reverse-proxy headers) and attach it to the
 * narrow `RpcRequest` seen by host-side API implementations. Keeping the shape
 * browser-safe lets policy helpers and tests import it without pulling in Node
 * or a concrete auth backend.
 */

/** Stable product roles used by the first multi-user Web UI integration. */
export type ApiAuthRole = 'admin' | 'user'

/** Authenticated caller projection visible to API policy checks. */
export interface ApiAuthIdentity {
  /** Stable user id from the auth provider or local DSH user store. */
  readonly userId: string
  /** Coarse deployment role; finer sharing can layer on top later. */
  readonly role: ApiAuthRole
  /** Optional display email, redacted from logs by policy callers when needed. */
  readonly email?: string
  /** Optional display name for UI/admin surfaces. */
  readonly name?: string
  /** Auth source, e.g. local login, trusted header, or Open WebUI bridge. */
  readonly source?: string
}

/** Per-request context resolved before one API call reaches business logic. */
export interface ApiRequestContext {
  /** Absent when auth is disabled or the carrier intentionally serves anonymous mode. */
  readonly auth?: ApiAuthIdentity
}
