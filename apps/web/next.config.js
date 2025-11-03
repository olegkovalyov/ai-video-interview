/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable strict linting rules during build
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Disable type checking during build (use tsc separately)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
