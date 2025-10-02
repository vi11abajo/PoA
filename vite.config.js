import { defineConfig } from 'vite'
import path from 'path'

// Определяем какой файл собирать
const entry = process.env.BUILD_TARGET === 'tournament'
    ? path.resolve(__dirname, 'tournament/tournament-wallet-connector-wagmi.js')
    : path.resolve(__dirname, 'wallet-connector-wagmi.js')

const fileName = process.env.BUILD_TARGET === 'tournament'
    ? 'tournament-wallet-connector-wagmi.bundle'
    : 'wallet-connector-wagmi.bundle'

export default defineConfig({
    build: {
        lib: {
            entry: entry,
            name: 'WalletConnector',
            formats: ['iife'],
            fileName: () => `${fileName}.js`
        },
        rollupOptions: {
            output: {
                extend: true
            }
        },
        outDir: 'dist',
        emptyOutDir: false,
        sourcemap: true
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    }
})
