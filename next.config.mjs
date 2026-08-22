/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["@prisma/client", "prisma", "sharp", "tesseract.js"],
  // Allow document uploads through the Next.js proxy without truncating multipart bodies.
  proxyClientMaxBodySize: "12mb",
  serverActions: {
    bodySizeLimit: "12mb",
  },
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
}

export default nextConfig
