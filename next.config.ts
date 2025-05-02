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
    ],
  },
};

export default nextConfig;
