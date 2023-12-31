import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    define: {
        'process.env': process.env,
    },
    server: {
        host: true,
    },
    base: './',
    // resolve: {
    //     alias: {
    //         '@api-platform/admin/src/InputGuesser': './node_modules/@api-platform/admin/src/InputGuesser'
    //     }
    // }
});
