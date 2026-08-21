/**
 * downloads domain contract: host-only download surfaces — the GET-download
 * channel family, the mirror of the SSE-stream `events` domain. No wire
 * envelope: the carrier's GET routes answer these directly, and the browser
 * `IApiClient` never exposes them.
 */

import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { ApiRequestContext } from './request-context.ts'

/** Host-only download request, resolved from query params plus carrier-local context. */
export interface SessionLogDownloadRequest {
  readonly sessionId: SessionId
  readonly includeDescendants?: boolean
  /** Request-local metadata resolved by the carrier; never serialized in the URL query. */
  readonly context?: ApiRequestContext
}

/** Host-only download surfaces (no wire envelope; absent from IApiClient). */
export interface DownloadsApi {
  /**
   * Stream one session-log ZIP — the root artifact verbatim plus each subagent
   * descendant's — as an attachment response. The carrier's GET route answers
   * this directly; the browser never calls it.
   * @param request - the root session id and whether to include descendants.
   * @param signal - cancellation for the underlying reads.
   * @returns the ZIP attachment response; missing services answer 500 and a
   * missing root session 404 before any byte is produced.
   */
  sessionLog(
    request: SessionLogDownloadRequest,
    signal: AbortSignal,
  ): Promise<Response>
}
