import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  await prisma.channel.createMany({
    data: [
      { name: "Mixx by Yas", code: "mixx_by_yas" },
      { name: "Vodacom", code: "vodacom" },
      { name: "Airtel", code: "airtel" },
      { name: "Halotel", code: "halotel" },
      { name: "TTCL", code: "ttcl" },
    ],
    skipDuplicates: true,
  })

  await prisma.businessSector.createMany({
    data: [
      { name: "All", code: "all" },
      { name: "Accommodation and meals", code: "accommodation_meals" },
      { name: "Administration support service", code: "administration_support" },
      { name: "Art, play, entertainment", code: "art_play_entertainment" },
      { name: "Education", code: "education" },
      { name: "Finance, banking, insurance", code: "finance_banking_insurance" },
      { name: "Medical", code: "medical" },
      { name: "Other services", code: "other_services" },
      { name: "Telecommunication", code: "telecommunication" },
    ],
    skipDuplicates: true,
  })

  const types = [
    {
      code: "id_front",
      name: "ID Card Front",
      required: true,
      allowedMime: ["image/jpeg", "image/png", "application/pdf"],
      maxSizeBytes: 10485760,
      sortOrder: 10,
    },
    {
      code: "id_back",
      name: "ID Card Back",
      required: true,
      allowedMime: ["image/jpeg", "image/png", "application/pdf"],
      maxSizeBytes: 10485760,
      sortOrder: 20,
    },
    {
      code: "tin",
      name: "TIN Document",
      required: true,
      allowedMime: ["image/jpeg", "image/png", "application/pdf"],
      maxSizeBytes: 10485760,
      sortOrder: 30,
    },
    {
      code: "portrait",
      name: "Portrait",
      required: true,
      allowedMime: ["image/jpeg", "image/png"],
      maxSizeBytes: 10485760,
      sortOrder: 40,
    },
    {
      code: "shop_image",
      name: "Shop Image",
      required: true,
      allowedMime: ["image/jpeg", "image/png"],
      maxSizeBytes: 10485760,
      sortOrder: 50,
    },
    {
      code: "contract",
      name: "Agreement Contract",
      required: true,
      allowedMime: ["application/pdf"],
      maxSizeBytes: 10485760,
      sortOrder: 60,
    },
    {
      code: "licence",
      name: "Business Licence",
      required: false,
      allowedMime: ["image/jpeg", "image/png", "application/pdf"],
      maxSizeBytes: 10485760,
      sortOrder: 70,
    },
    {
      code: "other",
      name: "Other",
      required: false,
      allowedMime: ["image/jpeg", "image/png", "application/pdf"],
      maxSizeBytes: 10485760,
      sortOrder: 80,
    },
    {
      code: "deposit_proof",
      name: "Deposit Proof",
      required: false,
      allowedMime: ["image/jpeg", "image/png", "application/pdf"],
      maxSizeBytes: 10485760,
      sortOrder: 90,
    },
  ]

  for (const type of types) {
    await prisma.documentType.upsert({
      where: { code: type.code },
      update: type,
      create: type,
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
