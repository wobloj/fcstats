const BASE_URL = "https://open.faceit.com/data/v4"

export async function faceitFetch<T>(path: string): Promise<T> {
  const apiKey = process.env.FACEIT_API_KEY

  if (!apiKey) {
    throw new Error("FACEIT_API_KEY_NOT_CONFIGURED")
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("FACEIT_NOT_FOUND")
    }

    if (response.status === 429) {
      throw new Error("FACEIT_RATE_LIMIT")
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error("FACEIT_AUTH_ERROR")
    }

    throw new Error("FACEIT_UPSTREAM_ERROR")
  }

  return response.json() as Promise<T>
}

export function encodePathSegment(value: string) {
  return encodeURIComponent(value)
}
