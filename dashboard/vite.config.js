import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const apiTarget = process.env.GARRISON_API_URL || 'http://127.0.0.1:8700';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@views': path.resolve(__dirname, './src/views'),
      '@context': path.resolve(__dirname, './src/context'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@i18n': path.resolve(__dirname, './src/i18n')
    }
  },
  server: {
    port: 3000,
    host: '127.0.0.1',
    proxy: {
      '/v1.0': { target: apiTarget, changeOrigin: true, ws: true },
      '/openapi.json': { target: apiTarget, changeOrigin: true }
    }
  },
  preview: { port: 4173, host: '127.0.0.1' },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'vendor';
          if (/node_modules\/(i18next|react-i18next|i18next-browser-languagedetector)\//.test(id)) return 'i18n';
          // The Markdown renderer and sanitizer (no app imports) keep the views chunk under the size warning.
          if (/node_modules\/(marked|dompurify)\//.test(id)) return 'markdown';
          // The Markdown view and its renderer too, so the studio (AD7.10) can show answers without importing the views chunk.
          if (id.endsWith('/src/components/MarkdownView.jsx') || id.endsWith('/src/utils/markdown.js')) return 'markdown';
          // Two chunks per locale (the catalog, and its tooltips and explainers) keep every chunk under the size warning;
          // the Japanese catalog with its tooltips passed 500 kB with the Apps tab (AD6.11).
          const locale = id.match(/\/src\/i18n\/locales\/([A-Za-z-]+?)(\.tips)?\.js$/);
          if (locale) return `locale-${locale[1]}${locale[2] ? '-tips' : ''}`;
          // Pipeline components (P12.9) get their own chunk so the views chunk stays under the size warning.
          if (/\/src\/components\/Pipeline/.test(id)) return 'pipelines';
          // Trigger and notification components (P12.5, P12.14) likewise.
          if (/\/src\/components\/(Trigger|Notification|SigningSecret)/.test(id)) return 'triggers';
          // Agent revisions and promotions (AD1.9), with the confirmation dialog they share with the views (no chunk cycle).
          // The prompt template clone dialog joins them, shared by the views and the studio's architect prompt panel (AD7.16).
          if (/\/src\/components\/(AgentRevision|Revision|Promot|ConfirmModal|CloneTemplateModal)/.test(id)) return 'revisions';
          // Agent assets (AD2.8): the version, upload, and pin dialogs used by both the views and the revisions panel.
          if (/\/src\/components\/(AgentAsset|AssetUpload)/.test(id) || id.endsWith('/src/utils/assets.js')) return 'assets';
          // Conversation file spaces (AD3.8): the Files tab, its version dialog, and its upload panel.
          if (/\/src\/components\/ConversationFile/.test(id) || id.endsWith('/src/utils/fileSpaces.js')) return 'files';
          // Capability catalog (AD4.8): the detail panel, refresh dialog, and revision capability editor, plus their helpers,
          // shared by the views and the revisions panel.
          if (/\/src\/components\/(Capability|AgentCapabilities)/.test(id) || id.endsWith('/src/utils/capabilities.js')) return 'capabilities';
          // Agentic apps (AD6.11): the Apps tab's graph, share link, delegation, revisions, and promote dialogs, and their
          // helpers. The page configuration stays with the views, which re-export it (no chunk cycle).
          if (/\/src\/components\/AgenticApp/.test(id) || id.endsWith('/src/utils/apps.js')) return 'apps';
          // Agent studio (AD7.10): the workspace panels, the architect dialogs and prompt panel, and their helpers. The two
          // studio pages stay with the views; the panels import nothing from the views chunk (no chunk cycle). The chat
          // transcript hook, shared by the architect chat and the agent wizard's test chat, joins them for the same reason.
          // The studio canvas (AD8.2): React Flow, the YAML library, the canvas panels, and their helpers load only when a
          // draft's Graph tab opens. The canvas imports from the studio chunk; the studio reaches it by dynamic import.
          if (/node_modules\/(@xyflow|d3-[a-z-]+|zustand|use-sync-external-store|classcat|yaml)\//.test(id)) return 'canvas';
          if (id.includes('/src/components/studio/canvas/') || id.endsWith('/src/utils/studioCanvas.js') || id.endsWith('/src/utils/manifestYaml.js')) return 'canvas';
          if (id.includes('/src/components/studio/') || id.endsWith('/src/utils/studio.js') || id.endsWith('/src/hooks/useStudioDraftChannel.js') || id.endsWith('/src/hooks/useChatTranscript.js')) return 'studio';
          if (id.includes('/src/views/')) return 'views';
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
