/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["@prisma/client", "prisma", "sharp", "tesseract.js"],
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
}

export default nextConfig
