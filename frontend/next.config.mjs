/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  // Pin the project root (a stray package-lock.json in the home folder confuses auto-detection).
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
