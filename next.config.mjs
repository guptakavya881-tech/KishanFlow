/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['node:sqlite', 'bcryptjs'],
};

export default nextConfig;
