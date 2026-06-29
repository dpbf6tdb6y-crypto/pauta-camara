/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer && Array.isArray(config.externals)) {
      config.externals.push('pdf-parse');
    }
    return config;
  },
};

export default nextConfig;
