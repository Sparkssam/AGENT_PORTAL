import { LoginScreen } from "./login-screen"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; timeout?: string; mfa?: string }>
}) {
  const { mode, timeout, mfa } = await searchParams
  return (
    <LoginScreen
      initialMode={mode === "signup" ? "signup" : "signin"}
      timedOut={timeout === "1"}
      needsMfa={mfa === "1"}
    />
  )
}
