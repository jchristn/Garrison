import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The app UI is one build for every app. It is served under /apps/ and reads the app's slug from the URL path
// (/apps/{slug}/...), so the same files serve every app. Hashed bundles go to /apps/_ui/, a name no slug can take
// (slugs are lowercase letters, digits, and hyphens), so a request for an asset never collides with an app.
const apiTarget = process.env.GARRISON_API_URL || 'http://127.0.0.1:8700';

export default defineConfig({
  base: '/apps/',
  plugins: [react()],
  server: {
    port: 3100,
    host: '127.0.0.1',
    proxy: {
      '/v1.0': { target: apiTarget, changeOrigin: true }
    }
  },
  preview: { port: 4174, host: '127.0.0.1' },
  build: {
    outDir: 'dist',
    assetsDir: '_ui',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor';
          if (/node_modules\/(i18next|react-i18next|i18next-browser-languagedetector)\//.test(id)) return 'i18n';
          if (/node_modules\/(marked|dompurify)\//.test(id)) return 'markdown';
          const locale = id.match(/\/src\/i18n\/locales\/([A-Za-z-]+?)\.js$/);
          if (locale) return `locale-${locale[1]}`;
          return undefined;
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
    globals: false
  }
});
