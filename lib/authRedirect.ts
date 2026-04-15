'use client'

const REDIRECT_AFTER_LOGIN_KEY = 'redirectAfterLogin'
const AUTH_ROUTE_PREFIXES = ['/auth', '/login']

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTE_PREFIXES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

function normalizeInternalRoute(candidate: string | null | undefined): string | null {
  if (!candidate || typeof candidate !== 'string') {
    return null
  }

  const trimmedCandidate = candidate.trim()
  if (!trimmedCandidate.startsWith('/') || trimmedCandidate.startsWith('//')) {
    return null
  }

  try {
    const baseOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    const url = new URL(trimmedCandidate, baseOrigin)

    if (url.origin !== baseOrigin || isAuthRoute(url.pathname)) {
      return null
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

export function getCurrentInternalRoute(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return normalizeInternalRoute(`${window.location.pathname}${window.location.search}${window.location.hash}`)
}

export function storeRedirectAfterLogin(route?: string | null): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  const redirectPath = normalizeInternalRoute(route ?? getCurrentInternalRoute())
  if (!redirectPath) {
    return null
  }

  window.sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, redirectPath)
  return redirectPath
}

export function getStoredRedirectAfterLogin(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return normalizeInternalRoute(window.sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY))
}

export function consumeRedirectAfterLogin(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  const redirectPath = getStoredRedirectAfterLogin()
  window.sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY)
  return redirectPath
}

export function syncLegacyReturnUrl(returnUrl: string | null | undefined): string | null {
  return storeRedirectAfterLogin(returnUrl)
}
