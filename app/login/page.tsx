import { LoginScreen } from "./login-screen"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const { mode } = await searchParams
  return <LoginScreen initialMode={mode === "signup" ? "signup" : "signin"} />
}
