import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Optimize for production deployment
  build: {
    target: 'es2015',
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks
          'three': ['three'],
          'react-three': ['@react-three/fiber', '@react-three/drei', '@react-three/rapier'],
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
    // Increase chunk size warning limit for 3D libraries
    chunkSizeWarningLimit: 2000,
  },
  
  // Optimize dev server
  server: {
    port: 3000,
    open: true,
  },
  
  // Handle imports for Three.js and physics libraries
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/rapier'],
  },
})
