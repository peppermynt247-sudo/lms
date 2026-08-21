/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'abc-courses-media.sgp1.cdn.digitaloceanspaces.com',
        pathname: '/atoms-lms/**',
      },
    ],
  },
};
