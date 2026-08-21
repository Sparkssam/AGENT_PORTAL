export async function withFallback<T>(live: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await live()
  } catch {
    return fallback
  }
}
