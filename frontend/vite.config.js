import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/election/',
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks: undefined,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            api: path.resolve(__dirname, './src/api'),
            assets: path.resolve(__dirname, './src/assets'),
            components: path.resolve(__dirname, './src/components'),
            config: path.resolve(__dirname, './src/config'),
            contexts: path.resolve(__dirname, './src/contexts'),
            data: path.resolve(__dirname, './src/data'),
            hooks: path.resolve(__dirname, './src/hooks'),
            layout: path.resolve(__dirname, './src/layout'),
            'menu-items': path.resolve(__dirname, './src/menu-items'),
            pages: path.resolve(__dirname, './src/pages'),
            routes: path.resolve(__dirname, './src/routes'),
            sections: path.resolve(__dirname, './src/sections'),
            store: path.resolve(__dirname, './src/store'),
            themes: path.resolve(__dirname, './src/themes'),
            utils: path.resolve(__dirname, './src/utils')
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
    }
});
