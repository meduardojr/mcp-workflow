import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react',    test: /node_modules\/(react-dom|react)\// },
            { name: 'supabase', test: /node_modules\/@supabase\/supabase-js/ },
            { name: 'state',    test: /node_modules\/(zustand|immer)/ },
          ],
        },
      },
    },
  },
})
