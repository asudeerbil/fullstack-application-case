import react from '@vitejs/plugin-react'; // React kullandığınızı görüyorum
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
    server: {
        host: '0.0.0.0', // Docker içinde dışarıdan erişime izin verir
        port: 5173, // Portu sabitler
        hmr: {
            host: 'localhost', // Tarayıcının Hot Module Replacement için bağlanacağı adres
        },
    },
});
