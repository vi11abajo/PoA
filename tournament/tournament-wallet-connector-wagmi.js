// 💼 TOURNAMENT WALLET CONNECTOR (WAGMI)
// Упрощенный wallet connector для турнирной системы на базе Wagmi Core

import {
    connect,
    disconnect,
    reconnect,
    getAccount,
    watchAccount,
    getBalance,
    switchChain,
    getChainId
} from '@wagmi/core'
import { wagmiConfig, pharosTestnet, WAGMI_CONSTANTS } from '../src/blockchain/wagmi-config.js'

class TournamentWalletConnectorWagmi {
    constructor() {
        this.web3 = null;
        this.account = null;
        this.connected = false;
        this.walletType = null;
        this.unwatchAccount = null;

        this.config = {
            NETWORK_NAME: WAGMI_CONSTANTS.NETWORK_NAME,
            RPC_URL: WAGMI_CONSTANTS.RPC_URL,
            CHAIN_ID: WAGMI_CONSTANTS.CHAIN_ID.toString(),
        };

        this.createWalletModal();
        this.setupAccountWatcher();
        this.autoReconnect();
    }

    // 🔄 Автоматическое переподключение при загрузке
    async autoReconnect() {
        try {
            const result = await reconnect(wagmiConfig);

            if (result && result.length > 0) {
                const account = getAccount(wagmiConfig);
                if (account.isConnected && account.address) {
                    this.account = account.address;
                    this.connected = true;
                    this.updateWalletButton();

                    if (window.tournamentLobby) {
                        window.tournamentLobby.onWalletConnected(this.account);
                    }
                }
            }
        } catch (error) {
            // Тихо игнорируем ошибки автоподключения
        }
    }

    // 👀 Следим за изменениями аккаунта
    setupAccountWatcher() {
        this.unwatchAccount = watchAccount(wagmiConfig, {
            onChange: (account) => {
                if (account.address) {
                    this.account = account.address;
                    this.connected = account.isConnected;
                    this.updateWalletButton();

                    if (window.tournamentLobby) {
                        window.tournamentLobby.onWalletConnected(this.account);
                    }
                } else {
                    this.account = null;
                    this.connected = false;
                    this.updateWalletButton();

                    if (window.tournamentLobby) {
                        window.tournamentLobby.onWalletDisconnected();
                    }
                }
            }
        });
    }

    // Создание модального окна для подключения кошелька
    createWalletModal() {
        if (document.getElementById('wallet-modal')) return;

        // Добавляем стили в head
        const style = document.createElement('style');
        style.textContent = `
            .wallet-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 2000;
                animation: fadeIn 0.2s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .wallet-modal-content {
                background: linear-gradient(135deg, rgba(0, 17, 34, 0.98) 0%, rgba(0, 51, 102, 0.95) 100%);
                padding: 0;
                border-radius: 24px;
                border: 2px solid rgba(0, 221, 255, 0.5);
                box-shadow: 0 0 50px rgba(0, 221, 255, 0.4), 0 8px 32px rgba(0, 0, 0, 0.5);
                max-width: 360px;
                width: 90%;
                position: relative;
                animation: slideUp 0.3s ease;
                overflow: hidden;
            }

            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .wallet-modal-header {
                padding: 20px 24px;
                border-bottom: 1px solid rgba(0, 221, 255, 0.3);
                background: rgba(0, 221, 255, 0.05);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .wallet-modal h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 700;
                color: #00ddff;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            }

            .wallet-modal-body {
                padding: 8px;
            }

            .wallet-category {
                margin-bottom: 16px;
            }

            .wallet-category-title {
                font-size: 14px;
                font-weight: 700;
                color: #66ccff;
                padding: 12px 16px 8px;
                text-align: left;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .wallet-option {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
                margin: 4px 8px;
                border: 1px solid rgba(0, 221, 255, 0.2);
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.125s ease;
                background: rgba(0, 221, 255, 0.05);
                color: #00ddff;
            }

            .wallet-option:hover {
                background: rgba(0, 221, 255, 0.15);
                border-color: #00ddff;
                transform: scale(1.02);
                box-shadow: 0 0 15px rgba(0, 221, 255, 0.3);
            }

            .wallet-option:active {
                transform: scale(0.98);
            }

            .wallet-option-left {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .wallet-option img {
                width: 40px;
                height: 40px;
                border-radius: 10px;
                border: 1px solid rgba(0, 221, 255, 0.3);
            }

            .wallet-option-name {
                font-size: 16px;
                font-weight: 600;
                color: #00ddff;
            }

            .wallet-info {
                padding: 16px 24px;
                border-top: 1px solid rgba(0, 221, 255, 0.3);
                background: rgba(0, 221, 255, 0.05);
            }

            .wallet-info-title {
                font-size: 14px;
                font-weight: 600;
                color: #00ddff;
                margin-bottom: 8px;
            }

            .wallet-info-text {
                font-size: 13px;
                color: #66ccff;
                line-height: 1.5;
            }

            .close-modal {
                background: rgba(0, 221, 255, 0.1);
                border: 1px solid rgba(0, 221, 255, 0.3);
                color: #00ddff;
                font-size: 20px;
                cursor: pointer;
                padding: 8px;
                width: 32px;
                height: 32px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.125s ease;
            }

            .close-modal:hover {
                background: rgba(0, 221, 255, 0.2);
                border-color: #00ddff;
                box-shadow: 0 0 10px rgba(0, 221, 255, 0.4);
            }

            .wallet-message {
                padding: 12px;
                margin: 8px;
                border-radius: 12px;
                font-size: 14px;
            }

            .error-message {
                background: rgba(255, 102, 102, 0.1);
                border: 1px solid rgba(255, 102, 102, 0.3);
                color: rgb(255, 51, 51);
            }

            .success-message {
                background: rgba(0, 163, 92, 0.1);
                border: 1px solid rgba(0, 163, 92, 0.3);
                color: rgb(0, 163, 92);
            }
        `;
        document.head.appendChild(style);

        const modal = document.createElement('div');
        modal.id = 'wallet-modal';
        modal.className = 'wallet-modal';
        modal.innerHTML = `
            <div class="wallet-modal-content">
                <div class="wallet-modal-header">
                    <h3>Connect Wallet</h3>
                    <button class="close-modal" onclick="tournamentWalletConnector.hideWalletModal()">✕</button>
                </div>

                <div class="wallet-modal-body">
                    <div id="wallet-message" class="wallet-message"></div>

                    <div class="wallet-category">
                        <div class="wallet-category-title">Popular</div>

                        <div class="wallet-option" onclick="tournamentWalletConnector.connectWallet('metamask')">
                            <div class="wallet-option-left">
                                <img src="../images/mmicon.png" alt="MetaMask">
                                <span class="wallet-option-name">MetaMask</span>
                            </div>
                        </div>

                        <div class="wallet-option" onclick="tournamentWalletConnector.connectWallet('okx')">
                            <div class="wallet-option-left">
                                <img src="../images/okxicon.png" alt="OKX">
                                <span class="wallet-option-name">OKX Wallet</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // Показать модалку кошелька
    async showWalletModal() {
        if (this.connected) {
            await this.disconnect();
        } else {
            const modal = document.getElementById('wallet-modal');
            if (modal) modal.style.display = 'flex';
        }
    }

    // Скрыть модалку кошелька
    hideWalletModal() {
        const modal = document.getElementById('wallet-modal');
        if (modal) modal.style.display = 'none';
        this.clearMessage();
    }

    // Подключение кошелька
    async connectWallet(walletType) {
        try {
            this.showLoading('Connecting...');

            // 🔗 Используем Wagmi для подключения
            const connectors = wagmiConfig.connectors;
            let connector;

            if (walletType === 'metamask') {
                connector = connectors.find(c => c.id === 'injected' || c.name.includes('MetaMask'));
                if (!connector && typeof window.ethereum === 'undefined') {
                    throw new Error('MetaMask not detected. Please install MetaMask extension.');
                }
            } else if (walletType === 'okx') {
                connector = connectors.find(c => c.id === 'okx' || c.name.includes('OKX'));
                if (!connector && typeof window.okexchain === 'undefined' && !window.ethereum?.isOkxWallet) {
                    throw new Error('OKX Wallet not detected. Please install OKX Wallet extension.');
                }
            } else {
                throw new Error('Unsupported wallet type');
            }

            // Подключаемся через Wagmi
            await connect(wagmiConfig, { connector });

            // Проверяем аккаунт
            const account = getAccount(wagmiConfig);
            if (!account.address) {
                throw new Error('No accounts found. Please unlock your wallet.');
            }

            this.account = account.address;
            this.walletType = walletType;

            // Проверяем сеть
            const chainId = getChainId(wagmiConfig);
            if (chainId !== pharosTestnet.id) {
                await this.switchNetwork();
            }

            this.connected = true;
            this.hideWalletModal();
            this.showSuccess('Wallet connected successfully!');

            // Обновляем UI
            this.updateWalletButton();

            // Уведомляем турнирное лобби о подключении
            if (window.tournamentLobby) {
                window.tournamentLobby.onWalletConnected(this.account);
            }

        } catch (error) {
            Logger.error('Connection error:', error);
            this.showError(error.message || 'Connection failed');
        }
    }

    // Отключение кошелька
    async disconnect() {
        try {
            await disconnect(wagmiConfig);
            this.web3 = null;
            this.account = null;
            this.connected = false;
            this.walletType = null;

            window.web3 = null;
            this.updateWalletButton();

            // Уведомляем турнирное лобби об отключении
            if (window.tournamentLobby) {
                await window.tournamentLobby.onWalletDisconnected();
            }

        } catch (error) {
            Logger.error('Disconnect error:', error);
        }
    }

    // Переключение сети
    async switchNetwork() {
        try {
            await switchChain(wagmiConfig, { chainId: pharosTestnet.id });
        } catch (error) {
            // Если сеть не добавлена, пытаемся добавить через window.ethereum
            if (error.code === 4902 && window.ethereum) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: `0x${pharosTestnet.id.toString(16)}`,
                        chainName: pharosTestnet.name,
                        rpcUrls: [this.config.RPC_URL],
                        nativeCurrency: pharosTestnet.nativeCurrency
                    }]
                });
            } else {
                throw error;
            }
        }
    }

    // Обновление кнопки кошелька
    updateWalletButton() {
        const walletButton = document.getElementById('walletButton');
        const walletStatus = document.getElementById('walletStatus');

        if (walletButton && walletStatus) {
            if (this.connected && this.account) {
                walletButton.classList.add('connected');
                const shortAddress = `${this.account.slice(0, 6)}...${this.account.slice(-4)}`;
                walletStatus.textContent = shortAddress;
            } else {
                walletButton.classList.remove('connected');
                walletStatus.textContent = 'Connect Wallet';
            }
        }
    }

    // Показать загрузку
    showLoading(message) {
        const messageEl = document.getElementById('wallet-message');
        if (messageEl) {
            messageEl.innerHTML = `
                <div style="
                    border: 3px solid rgba(0, 221, 255, 0.3);
                    border-top: 3px solid #00ddff;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 15px;
                "></div>
                <p>${message}</p>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
        }
    }

    // Показать ошибку
    showError(message) {
        const messageEl = document.getElementById('wallet-message');
        if (messageEl) {
            messageEl.innerHTML = `
                <div style="
                    background: rgba(255, 102, 102, 0.2);
                    border: 1px solid #ff6666;
                    color: #ff6666;
                    padding: 10px;
                    border-radius: 8px;
                    font-size: 14px;
                ">${message}</div>
            `;
            setTimeout(() => this.clearMessage(), TOURNAMENT_CONSTANTS.TIMEOUTS.MESSAGE_DISPLAY);
        }
    }

    // Показать успех
    showSuccess(message) {
        const messageEl = document.getElementById('wallet-message');
        if (messageEl) {
            messageEl.innerHTML = `
                <div style="
                    background: rgba(0, 255, 136, 0.2);
                    border: 1px solid #00ff88;
                    color: #00ff88;
                    padding: 10px;
                    border-radius: 8px;
                    font-size: 14px;
                ">${message}</div>
            `;
            setTimeout(() => this.clearMessage(), TOURNAMENT_CONSTANTS.TIMEOUTS.SUCCESS_MESSAGE);
        }
    }

    // Очистить сообщение
    clearMessage() {
        const messageEl = document.getElementById('wallet-message');
        if (messageEl) messageEl.innerHTML = '';
    }

    // Получить баланс
    async getBalance() {
        if (!this.account) return '0';

        try {
            const balance = await getBalance(wagmiConfig, {
                address: this.account
            });
            return balance.formatted;
        } catch (error) {
            Logger.error('Balance error:', error);
            return '0';
        }
    }

    // Отправить транзакцию (базовая версия для совместимости)
    async sendTransaction(to, value, data = '0x') {
        if (!this.account) {
            throw new Error('Wallet not connected');
        }

        try {
            // Для отправки транзакций используйте writeContract или sendTransaction из @wagmi/core
            throw new Error('Use writeContract or sendTransaction from @wagmi/core directly');
        } catch (error) {
            Logger.error('Transaction error:', error);
            throw error;
        }
    }

    // Получить состояние подключения
    getConnectionState() {
        return {
            connected: this.connected,
            account: this.account,
            walletType: this.walletType,
            chainId: this.config.CHAIN_ID
        };
    }

    // Метод init для совместимости с основным коннектором
    init() {
        return true;
    }

    // 🧹 Cleanup при уничтожении
    destroy() {
        if (this.unwatchAccount) {
            this.unwatchAccount();
        }
    }
}

// Создаем глобальный экземпляр
window.tournamentWalletConnector = new TournamentWalletConnectorWagmi();

// Делаем его доступным как walletConnector для совместимости
setTimeout(() => {
    window.walletConnector = window.tournamentWalletConnector;
}, 100);

// Обновляем функцию handleWalletToggle
window.handleWalletToggle = async function() {
    if (window.tournamentWalletConnector) {
        await window.tournamentWalletConnector.showWalletModal();
    } else {
        alert('Wallet connector not ready. Please refresh the page.');
    }
};
