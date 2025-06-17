/** @type {import('next').NextConfig} */
const nextConfig = {
  // WebSocket サーバーとの統合
  async rewrites() {
    return [
      {
        source: '/api/socket.io/:path*',
        destination: '/api/socket.io/:path*',
      },
    ]
  },
}

module.exports = nextConfig