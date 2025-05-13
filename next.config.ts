import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure Next.js doesn't strip trailing slashes from API routes
  trailingSlash: false,
  
  // Output standalone build
  output: 'standalone',
  
  // Configure memory limits
  serverRuntimeConfig: {
    maxDataSize: 500 * 1024 * 1024, // 500MB for large JSON files
  },
  
  // Increase memory limit for large JSON files
  webpack: (config, { isServer }) => {
    // Increase memory limit for processing large data files
    config.performance = {
      ...config.performance,
      maxAssetSize: 500 * 1024 * 1024, // 500 MB for device_activities.json
      maxEntrypointSize: 500 * 1024 * 1024,
      hints: false,
    };
    
    // Increase memory for Node.js for local development
    if (isServer) {
      config.externals = [
        ...config.externals,
      ];
    }
    
    // Add environment variables
    config.plugins = [
      ...config.plugins,
    ];
    
    // Return the modified config
    return config;
  },
};

export default nextConfig;
