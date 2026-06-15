import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import wails from '@wailsio/runtime/plugins/vite'
import { readdirSync, statSync, unlinkSync } from 'fs'
import { join } from 'path'

function cleanupRedundantFontFormats(): import('vite').Plugin {
  return {
    name: 'cleanup-redundant-font-formats',
    closeBundle() {
      // KaTeX ships .ttf, .woff and .woff2 variants. macOS 12.0+ supports
      // woff2 universally, so drop the heavier/older formats to shrink the
      // embedded frontend assets.
      const assetsDir = join(__dirname, 'dist', 'assets')
      try {
        for (const entry of readdirSync(assetsDir)) {
          if (entry.endsWith('.ttf') || entry.endsWith('.woff')) {
            unlinkSync(join(assetsDir, entry))
          }
        }
      } catch {
        // assets dir may not exist in dev/test
      }
    },
  }
}

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: Number(process.env.WAILS_VITE_PORT) || 9245,
    strictPort: true,
  },
  plugins: [vue(), wails('./bindings'), cleanupRedundantFontFormats()],
  build: {
    assetsInlineLimit: 4096,
    cssCodeSplit: false,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@milkdown/')) {
            return 'vendor-milkdown'
          }
          if (id.includes('node_modules/vue/') || id.includes('node_modules/@vue/')) {
            return 'vendor-vue'
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
  assetsInclude: ['**/*.woff', '**/*.woff2', '**/*.ttf', '**/*.eot'],
  optimizeDeps: {
    include: ['@milkdown/crepe'],
  },
})
