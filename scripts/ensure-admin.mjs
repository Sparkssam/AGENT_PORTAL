import { createClient } from "@supabase/supabase-js"
import { PrismaClient } from "@prisma/client"

const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD || ""
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment.")
  process.exit(1)
}
if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.")
  process.exit(1)
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const prisma = new PrismaClient()

async function findUserId() {
  let page = 1
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const match = data.users.find((user) => user.email?.toLowerCase() === email)
    if (match) return match.id
    if (data.users.length < 200) return null
    page += 1
  }
}

try {
  let userId = await findUserId()
  if (!userId) {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Sam Suya" },
      app_metadata: { role: "admin" },
    })
    if (created.error || !created.data.user) {
      throw new Error(created.error?.message || "Could not create admin user")
    }
    userId = created.data.user.id
    console.log("created_auth_user")
  } else {
    const updated = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { full_name: "Sam Suya" },
      app_metadata: { role: "admin" },
    })
    if (updated.error) throw new Error(updated.error.message)
    console.log("updated_auth_user")
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('kinetic.bypass_guards', 'on', true)`
    await tx.profile.upsert({
      where: { id: userId },
      create: {
        id: userId,
        role: "admin",
        fullName: "Sam Suya",
        email,
        title: "Super Administrator",
        initials: "SS",
      },
      update: {
        role: "admin",
        fullName: "Sam Suya",
        email,
        title: "Super Administrator",
        initials: "SS",
      },
    })
    await tx.agent.deleteMany({
      where: {
        profile: { role: { in: ["admin", "super_admin"] } },
        applications: { none: {} },
      },
    })
  })

  console.log("admin_ready", email)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
