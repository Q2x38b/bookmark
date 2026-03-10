import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React - cached aggressively
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Animation library - used frequently
          'framer': ['framer-motion'],
          // Convex - backend
          'convex': ['convex', 'convex/react', 'convex/react-clerk'],
          // Auth
          'clerk': ['@clerk/clerk-react'],
          // UI components (Radix)
          'radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
            '@radix-ui/react-select',
            '@radix-ui/react-context-menu',
          ],
        },
      },
    },
    // Increase chunk size warning limit since we're consciously chunking
    chunkSizeWarningLimit: 600,
  },
})
