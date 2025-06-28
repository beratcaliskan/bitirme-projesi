import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'http',
        hostname: '192.168.1.14',
        port: '8000',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    domains: [
      'images.pexels.com',
      'images.unsplash.com',
      'picsum.photos',
      'via.placeholder.com',
      'fastly.picsum.photos',
      'cloudinary.com',
      'res.cloudinary.com',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      'platform-lookaside.fbsbx.com',
      'img.freepik.com',
      'i.imgur.com',
      'raw.githubusercontent.com',
      '192.168.1.14',
      'localhost',
    ],
  },
};

export default nextConfig;
