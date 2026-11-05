import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        servicios: resolve(__dirname, 'servicios.html'),
        reservar: resolve(__dirname, 'reservar.html'),
        admin: resolve(__dirname, 'panel-greenxpark-gestion-2026.html'),
      },
    },
  },
});

