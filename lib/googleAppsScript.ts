export const GOOGLE_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || ''

export type GoogleAppsScriptResponse = {
  success: boolean
  message?: string
  error?: string
  [key: string]: unknown
}

export async function postToGoogleAppsScript(
  payload: Record<string, unknown>,
): Promise<{
  ok: boolean
  status: number
  data: GoogleAppsScriptResponse | string
}> {
  if (!GOOGLE_SCRIPT_URL) {
    return {
      ok: false,
      status: 503,
      data: {
        success: false,
        error: 'Google Apps Script URL is not configured.',
      },
    }
  }

  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const raw = await response.text()

  try {
    return {
      ok: response.ok,
      status: response.status,
      data: raw ? (JSON.parse(raw) as GoogleAppsScriptResponse) : { success: response.ok },
    }
  } catch {
    return {
      ok: response.ok,
      status: response.status,
      data: raw,
    }
  }
}