// 🔧 WAGMI CONFIGURATION
// Конфигурация Wagmi Core для Pharos Testnet

import { createConfig, http, createStorage } from '@wagmi/core'
import { injected } from '@wagmi/connectors'

// 🌐 Определяем кастомную сеть Pharos Testnet
export const pharosTestnet = {
    id: 688688,
    name: 'Pharos Testnet',
    nativeCurrency: {
        name: 'PHRS',
        symbol: 'PHRS',
        decimals: 18
    },
    rpcUrls: {
        default: {
            http: ['https://testnet.dplabs-internal.com']
        },
        public: {
            http: ['https://testnet.dplabs-internal.com']
        }
    },
    blockExplorers: {
        default: {
            name: 'Pharos Explorer',
            url: 'https://explorer.pharos.network'
        }
    },
    testnet: true
}

// 📝 Создаём конфигурацию Wagmi с поддержкой сохранения состояния
export const wagmiConfig = createConfig({
    chains: [pharosTestnet],
    connectors: [
        // MetaMask connector
        injected({
            target: 'metaMask',
            shimDisconnect: true
        }),
        // OKX Wallet connector
        injected({
            target() {
                return {
                    id: 'okx',
                    name: 'OKX Wallet',
                    provider: window.okexchain || (window.ethereum?.isOkxWallet ? window.ethereum : undefined)
                }
            },
            shimDisconnect: true
        })
    ],
    transports: {
        [pharosTestnet.id]: http('https://testnet.dplabs-internal.com')
    },
    storage: createStorage({
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        key: 'wagmi.pharos'
    })
})

// 📊 Экспортируем константы
export const WAGMI_CONSTANTS = {
    CHAIN_ID: pharosTestnet.id,
    NETWORK_NAME: pharosTestnet.name,
    RPC_URL: 'https://testnet.dplabs-internal.com',
    NATIVE_CURRENCY: 'PHRS'
}
