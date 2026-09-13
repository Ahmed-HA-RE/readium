const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'public-assets-00.s3.ap-southeast-1.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;
