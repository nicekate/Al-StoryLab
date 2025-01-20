/** @type {import('next').NextConfig} */
const nextConfig = {
  // 允许访问 output 目录中的文件
  async rewrites() {
    return [
      {
        source: '/output/:path*',
        destination: '/output/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
  experimental: {
    serverActions: true,
  },
  webpack: (config) => {
    config.externals = [...config.externals, 'fs', 'path'];
    return config;
  },
}

module.exports = nextConfig
