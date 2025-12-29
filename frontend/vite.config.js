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
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://lunifcuuhhsacibvbvwi.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1bmlmY3V1aGhzYWNpYnZidndpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzODY5OTksImV4cCI6MjA4MTk2Mjk5OX0.nFBKnJBqEARvErvygrNfHDY6KuAsgomSchhfB0L8iIE'),
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
