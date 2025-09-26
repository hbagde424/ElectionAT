import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    // Use a production base path but keep '/' for development so vite dev server
    // serves ES modules from the root and avoids requests like
    // '/election/src/...' which can 404 in dev.
    base: process.env.NODE_ENV === 'production' ? '/election/' : '/',
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
        sourcemap: false,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules')) {
                        return 'vendor';
                    }
                },
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]',
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
