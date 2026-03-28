import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/get-news': 'http://localhost:5001',
      '/get-location': 'http://localhost:5001',
      '/health': 'http://localhost:5001',
    }
  }
});
