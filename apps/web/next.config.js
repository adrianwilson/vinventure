//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  
  // Static export for S3/CloudFront deployment
  output: 'export',
  distDir: '.next',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  
  // Configure webpack to resolve TypeScript path aliases
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@vinventure/ui': require('path').resolve(__dirname, '../../libs/ui/src'),
      '@vinventure/types': require('path').resolve(__dirname, '../../libs/types/src'),
      '@vinventure/database': require('path').resolve(__dirname, '../../libs/database/src'),
      '@vinventure/shared': require('path').resolve(__dirname, '../../libs/shared/src'),
    };
    return config;
  },
  
  // Skip build errors for Lambda deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Image optimization disabled for static export
  // Security headers handled by CloudFront
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
