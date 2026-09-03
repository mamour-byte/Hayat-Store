import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const vendorChunks = (id: string): string | undefined => {
  if (!id.includes('node_modules')) return undefined

  if (id.includes('react-dom') || id.includes('react/') || id.includes('react-router') || id.includes('react-router-dom') || id.includes('react-hook-form') || id.includes('scheduler')) {
    return 'react-vendor'
  }
  if (id.includes('@tanstack') || id.includes('axios')) {
    return 'data-vendor'
  }
  if (id.includes('zod')) {
    return 'validation-vendor'
  }
  if (id.includes('lucide')) {
    return 'icons-vendor'
  }
  if (id.includes('sonner')) {
    return 'toast-vendor'
  }
  if (id.includes('socket.io-client') || id.includes('engine.io-client')) {
    return 'socket-vendor'
  }
  if (id.includes('lottie-react') || id.includes('lottie-web')) {
    return 'lottie-vendor'
  }
  return undefined
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      output: {
        manualChunks: vendorChunks,
      },
    },
  },
})
