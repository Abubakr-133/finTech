import path from 'path'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc'; // Or your framework's plugin
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Include your framework's plugin
  // server: {
  //   proxy: {
  //     '/api': { // The path prefix for API requests in your frontend
  //       target: 'http://localhost:8000', // The URL of your backend server
  //       changeOrigin: true, // Rewrites the origin header to match the target
  //       secure: false, // Allows HTTPS requests even with self-signed certificates (for development)
  //     },
  //   },
  // },
});