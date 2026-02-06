/** @type {import('next').NextConfig} */
const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin');

const nextConfig = {
  reactStrictMode: true,
  
  // Optimasi Build Speed
  swcMinify: true, // SWC minifier lebih cepat dari Terser
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Optimasi untuk production build
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
          },
        },
      };
        }
        
        if (isServer) {
          config.plugins.push(
            new CopyWebpackPlugin({
              patterns: [
                // This pattern is for pdfkit's own data files
                {
                  from: path.join(__dirname, 'node_modules', 'pdfkit', 'js', 'data'),
                  to: path.join(config.output.path, 'vendor-chunks', 'data'),
                  noErrorOnMissing: true,
                },
                // This pattern copies all .trie files from fontkit to the correct runtime directory
                {
                  from: path.join(__dirname, 'node_modules', '@foliojs-fork', 'fontkit', '*.trie'),
                  to: path.join(config.output.path, 'vendor-chunks', '[name][ext]'),
                  noErrorOnMissing: true,
                },
              ],
            })
          );
        }
    
        return config;
  },
  
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  },
}

module.exports = nextConfig
