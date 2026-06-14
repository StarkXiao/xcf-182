import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    exclude: ['leancloud-storage', '@supabase/supabase-js']
  },
  build: {
    rollupOptions: {
      external: ['leancloud-storage', '@supabase/supabase-js']
    }
  }
})
