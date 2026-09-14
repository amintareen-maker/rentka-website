/** @type {import('next').NextConfig} */
const nextConfig = {
  // CSV is capped at 5 MB; allow transport overhead for quoted/unicode values.
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
