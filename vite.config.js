import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
import path from 'node:path'

function checkOptionalDepInstalled(name) {
  try {
    const pkgPath = path.resolve(process.cwd(), 'node_modules', name, 'package.json')
    return fs.existsSync(pkgPath)
  } catch (e) {
    return false
  }
}

export default defineConfig(() => {
  const optionalDeps = ['leancloud-storage', '@supabase/supabase-js']
  const installed = optionalDeps.filter(checkOptionalDepInstalled)
  const missing = optionalDeps.filter(d => !installed.includes(d))

  if (missing.length > 0) {
    console.log('\n[Leaderboard] Optional cloud SDK not installed (will use local storage):')
    missing.forEach(d => console.log(`  - ${d}`))
    console.log('  Install with: npm install ' + missing.join(' ') + '\n')
  } else {
    console.log('\n[Leaderboard] All cloud SDKs installed and available\n')
  }

  return {
    plugins: [vue()],
    server: {
      port: 3000,
      open: true
    },
    optimizeDeps: {
      exclude: missing
    },
    build: {
      chunkSizeWarningLimit: 2500,
      rollupOptions: {
        external: missing
      }
    }
  }
})
