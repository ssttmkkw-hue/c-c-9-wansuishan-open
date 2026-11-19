import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5199,
    host: '127.0.0.1',
    strictPort: true,
  },
  preview: {
    port: 5199,
    host: '127.0.0.1',
    strictPort: true,
  },
});
