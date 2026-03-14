import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/v1/auth': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/v1/hospitals': { target: 'http://localhost:3002', changeOrigin: true },
      '/api/v1/ambulances': { target: 'http://localhost:3002', changeOrigin: true },
      '/api/v1/police-stations': { target: 'http://localhost:3002', changeOrigin: true },
      '/api/v1/fire-stations': { target: 'http://localhost:3002', changeOrigin: true },
      '/api/v1/responders': { target: 'http://localhost:3002', changeOrigin: true },
      '/api/v1/incidents': { target: 'http://localhost:3002', changeOrigin: true },
      '/api/v1/vehicles': { target: 'http://localhost:3003', changeOrigin: true },
      '/api/v1/dispatches': { target: 'http://localhost:3003', changeOrigin: true },
      '/socket.io': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        ws: true,
      },
      '/api/v1/analytics': { target: 'http://localhost:3004', changeOrigin: true },
    },
  },
});
