import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Four HTML entry points, matching the four pages the server has always had
// (public/index.html, admin-login.html, admin.html, admin-dashboard.html) -
// this keeps the same URLs and page structure DEPLOYMENT.md already
// documents, just built with React now instead of vanilla JS. `npm run
// build` outputs to dist/, which server/index.js serves as the site root.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        adminLogin: resolve(__dirname, 'admin-login.html'),
        admin: resolve(__dirname, 'admin.html'),
        adminDashboard: resolve(__dirname, 'admin-dashboard.html'),
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      // So `npm run dev` inside client/ can hit the real API/images without
      // CORS trouble - the production build doesn't need this since it's
      // served by the same Express app that serves /api and /images.
      '/api': 'http://localhost:3000',
      '/images': 'http://localhost:3000',
    },
  },
});
