import type { ApiRequestContext, ApiAuthRole } from '@deepseek-ai/dsh-host-apiproxy/api'

export interface TrustedHeaderAuthConfig {
  /** Enable only behind a trusted reverse proxy that strips caller-supplied auth headers. */
  readonly enabled?: boolean
  /** Header carrying the stable user id. */
  readonly userIdHeader?: string
  /** Header carrying `admin` or `user`; missing means `user`. */
  readonly roleHeader?: string
  /** Optional display email header. */
  readonly emailHeader?: string
  /** Optional display name header. */
  readonly nameHeader?: string
  /** Optional auth source header, e.g. `open-webui`. */
  readonly sourceHeader?: string
  /** Fallback source when the source header is absent. */
  readonly source?: string
}

export const DEFAULT_TRUSTED_HEADER_AUTH = {
  enabled: false,
  userIdHeader: 'x-dsh-auth-user',
  roleHeader: 'x-dsh-auth-role',
  emailHeader: 'x-dsh-auth-email',
  nameHeader: 'x-dsh-auth-name',
  sourceHeader: 'x-dsh-auth-source',
  source: 'trusted-header',
} as const satisfies Required<TrustedHeaderAuthConfig>

export type RequestContextResolver = (request: Request) => ApiRequestContext | undefined

function headerName(name: string, field: keyof TrustedHeaderAuthConfig): string {
  const normalized = name.trim().toLowerCase()
  if (normalized === '' || /[\r\n:]/.test(normalized)) {
    throw new Error(`client-connection trusted header auth ${String(field)} must be a non-empty HTTP header name`)
  }
  return normalized
}

function headerValue(request: Request, name: string): string | undefined {
  const value = request.headers.get(name)?.trim()
  return value === undefined || value === '' ? undefined : value
}

function parseRole(value: string | undefined): ApiAuthRole | undefined {
  if (value === undefined) return 'user'
  const normalized = value.toLowerCase()
  return normalized === 'admin' || normalized === 'user' ? normalized : undefined
}

/**
 * Builds the request-context resolver for the trusted-header deployment mode.
 * The reverse proxy owns authentication; DSH only consumes the projected user.
 */
export function createTrustedHeaderAuthResolver(config?: TrustedHeaderAuthConfig): RequestContextResolver | undefined {
  const resolved = { ...DEFAULT_TRUSTED_HEADER_AUTH, ...config }
  if (!resolved.enabled) return undefined
  const userIdHeader = headerName(resolved.userIdHeader, 'userIdHeader')
  const roleHeader = headerName(resolved.roleHeader, 'roleHeader')
  const emailHeader = headerName(resolved.emailHeader, 'emailHeader')
  const nameHeader = headerName(resolved.nameHeader, 'nameHeader')
  const sourceHeader = headerName(resolved.sourceHeader, 'sourceHeader')
  const sourceFallback = resolved.source.trim() || DEFAULT_TRUSTED_HEADER_AUTH.source

  return (request) => {
    const userId = headerValue(request, userIdHeader)
    if (userId === undefined) return undefined
    const role = parseRole(headerValue(request, roleHeader))
    if (role === undefined) return undefined
    const email = headerValue(request, emailHeader)
    const name = headerValue(request, nameHeader)
    const source = headerValue(request, sourceHeader) ?? sourceFallback
    return {
      auth: {
        userId,
        role,
        ...email === undefined ? {} : { email },
        ...name === undefined ? {} : { name },
        source,
      },
    }
  }
}
