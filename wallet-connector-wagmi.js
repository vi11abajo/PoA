// 💼 WAGMI WALLET CONNECTOR
// Адаптер для замены старого wallet-connector.js на Wagmi Core
// Сохраняет полную совместимость с существующим API

import {
    connect,
    disconnect,
    reconnect,
    getAccount,
    watchAccount,
    getBalance,
    writeContract,
    readContract,
    switchChain,
    getChainId
} from '@wagmi/core'
import { wagmiConfig, pharosTestnet, WAGMI_CONSTANTS } from './src/blockchain/wagmi-config.js'

class WagmiWalletConnector {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.account = null;
        this.connected = false;
        this.walletType = null;
        this.isInitialized = false;
        this.unwatchAccount = null;

        this.config = {
            NETWORK_NAME: WAGMI_CONSTANTS.NETWORK_NAME,
            RPC_URL: WAGMI_CONSTANTS.RPC_URL,
            CHAIN_ID: WAGMI_CONSTANTS.CHAIN_ID.toString(),
            CONTRACT_ADDRESS: '0xaf655fe9fa8cdf421a024509b1cfc15dee89d85e',
            GAME_FEE: '0.001'
        };

        // ABI контракта - копируем из старого коннектора
        this.contractABI = [
            {
                "inputs": [],
                "name": "startGame",
                "outputs": [],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "_score", "type": "uint256"},
                    {"name": "_playerName", "type": "string"}
                ],
                "name": "recordScore",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"name": "_limit", "type": "uint256"}],
                "name": "getTopScores",
                "outputs": [
                    {
                        "components": [
                            {"name": "player", "type": "address"},
                            {"name": "score", "type": "uint256"},
                            {"name": "timestamp", "type": "uint256"},
                            {"name": "playerName", "type": "string"}
                        ],
                        "name": "",
                        "type": "tuple[]"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ];

        this.init();
    }

    init() {
        this.createWalletButton();
        this.createWalletModal();
        this.setupAccountWatcher();
        this.autoReconnect();
        this.isInitialized = true;
    }

    // 🔄 Автоматическое переподключение при загрузке
    async autoReconnect() {
        try {
            // Пытаемся переподключиться к последнему использованному коннектору
            const result = await reconnect(wagmiConfig);

            if (result && result.length > 0) {
                const account = getAccount(wagmiConfig);
                if (account.isConnected && account.address) {
                    this.account = account.address;
                    this.connected = true;

                    // Создаем Web3 экземпляр для совместимости
                    if (window.ethereum && window.Web3) {
                        this.web3 = new window.Web3(window.ethereum);
                    }

                    this.updateConnectionStatus();
                    Logger.info('Auto-reconnected to wallet:', this.account);
                }
            }
        } catch (error) {
            // Тихо игнорируем ошибки автоподключения
            // Пользователь может подключиться вручную
        }
    }

    // 👀 Следим за изменениями аккаунта
    setupAccountWatcher() {
        this.unwatchAccount = watchAccount(wagmiConfig, {
            onChange: (account) => {
                if (account.address) {
                    this.account = account.address;
                    this.connected = account.isConnected;

                    // Создаем Web3 экземпляр для совместимости при подключении
                    if (account.isConnected && window.ethereum && window.Web3) {
                        this.web3 = new window.Web3(window.ethereum);
                    }
                } else {
                    this.account = null;
                    this.connected = false;
                    this.web3 = null;
                }
                this.updateConnectionStatus();
            }
        });
    }

    createWalletButton() {
        if (document.getElementById('wallet-button')) return;

        const style = document.createElement('style');
        style.textContent = `
            .wallet-button {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
            }

            .wallet-button button {
                background: rgb(0, 122, 255);
                color: white;
                border: none;
                padding: 10px 16px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                border-radius: 12px;
                transition: all 0.125s ease;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                min-height: 40px;
                line-height: 1.2;
            }

            .wallet-button button:hover {
                background: rgb(0, 112, 240);
                transform: translateY(-1px);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
            }

            .wallet-button button:active {
                transform: translateY(0);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .wallet-button.connected button {
                background: rgb(0, 163, 92);
                color: white;
            }

            .wallet-button.connected button:hover {
                background: rgb(0, 145, 82);
            }

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

            .wallet-option-badge {
                background: rgba(0, 221, 255, 0.3);
                color: #00ddff;
                font-size: 12px;
                font-weight: 600;
                padding: 4px 8px;
                border-radius: 6px;
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
                margin: 15px 0;
            }

            .loading-spinner {
                border: 3px solid rgba(0, 221, 255, 0.3);
                border-top: 3px solid #00ddff;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
                margin: 0 auto 15px;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .error-message {
                background: rgba(255, 102, 102, 0.2);
                border: 1px solid #ff6666;
                color: #ff6666;
                padding: 10px;
                border-radius: 8px;
                font-size: 14px;
            }

            .success-message {
                background: rgba(0, 255, 136, 0.2);
                border: 1px solid #00ff88;
                color: #00ff88;
                padding: 10px;
                border-radius: 8px;
                font-size: 14px;
            }
        `;
        document.head.appendChild(style);
    }

    createWalletModal() {
        if (document.getElementById('wallet-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'wallet-modal';
        modal.className = 'wallet-modal';
        modal.innerHTML = `
            <div class="wallet-modal-content">
                <div class="wallet-modal-header">
                    <h3>Connect Wallet</h3>
                    <button class="close-modal" onclick="walletConnector.hideWalletModal()">✕</button>
                </div>

                <div class="wallet-modal-body">
                    <div id="wallet-message" class="wallet-message"></div>

                    <div class="wallet-category">
                        <div class="wallet-category-title">Choose Wallet</div>

                        <div class="wallet-option" onclick="walletConnector.connectWallet('rabby')">
                            <div class="wallet-option-left">
                                <img src="https://raw.githubusercontent.com/vi11abajo/PoA/main/images/rabbyicon.png" alt="Rabby">
                                <span class="wallet-option-name">Rabby Wallet</span>
                            </div>
                        </div>

                        <div class="wallet-option" onclick="walletConnector.connectWallet('okx')">
                            <div class="wallet-option-left">
                                <img src="https://raw.githubusercontent.com/vi11abajo/PoA/main/images/okxicon.png" alt="OKX">
                                <span class="wallet-option-name">OKX Wallet</span>
                            </div>
                        </div>

                        <div class="wallet-option" onclick="walletConnector.connectWallet('metamask')">
                            <div class="wallet-option-left">
                                <img src="https://raw.githubusercontent.com/vi11abajo/PoA/main/images/mmicon.png" alt="MetaMask">
                                <span class="wallet-option-name">MetaMask</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    showWalletModal() {
        if (this.connected) {
            this.disconnect();
        } else {
            // Воспроизводим звук выбора кошелька
            if (window.soundManager && window.soundManager.playSound) {
                window.soundManager.playSound('chooseWallet');
            }

            document.getElementById('wallet-modal').style.display = 'flex';
        }
    }

    hideWalletModal() {
        const modal = document.getElementById('wallet-modal');
        if (modal) modal.style.display = 'none';
        this.clearMessage();
        if (window.pendingGameStart) window.pendingGameStart = false;
    }

    async connectWallet(walletType) {
        try {
            this.showLoading('Connecting...');

            // 🔗 Используем Wagmi для подключения
            const connectors = wagmiConfig.connectors;
            let connector;

            if (walletType === 'metamask') {
                // Ищем коннектор для MetaMask
                connector = connectors.find(c =>
                    c.id === 'injected' ||
                    c.id === 'io.metamask' ||
                    c.name?.toLowerCase().includes('metamask')
                );

                // Если не нашли коннектор, пробуем injected (первый в списке)
                if (!connector) {
                    connector = connectors.find(c => c.id === 'injected');
                }

                // Проверяем наличие MetaMask
                if (!connector && typeof window.ethereum === 'undefined') {
                    throw new Error('MetaMask not detected. Please install MetaMask extension.');
                }

                // Если коннектор всё ещё не найден, но ethereum есть - берём первый injected
                if (!connector && window.ethereum) {
                    connector = connectors[0]; // Fallback на первый коннектор
                }
            } else if (walletType === 'okx') {
                // Ищем коннектор для OKX
                connector = connectors.find(c =>
                    c.id === 'okx' ||
                    c.id === 'com.okex.wallet' ||
                    c.name?.toLowerCase().includes('okx')
                );

                // Если не нашли, пробуем через injected
                if (!connector && (window.okexchain || window.ethereum?.isOkxWallet)) {
                    connector = connectors.find(c => c.id === 'injected');
                }

                // Проверяем наличие OKX
                if (!connector && typeof window.okexchain === 'undefined' && !window.ethereum?.isOkxWallet) {
                    throw new Error('OKX Wallet not detected. Please install OKX Wallet extension.');
                }
            } else if (walletType === 'rabby') {
                // Ищем коннектор для Rabby
                connector = connectors.find(c =>
                    c.id === 'rabby' ||
                    c.id === 'io.rabby' ||
                    c.name?.toLowerCase().includes('rabby')
                );

                // Если не нашли, пробуем через injected
                if (!connector && window.ethereum?.isRabby) {
                    connector = connectors.find(c => c.id === 'injected');
                }

                // Проверяем наличие Rabby
                if (!connector && !window.ethereum?.isRabby) {
                    throw new Error('Rabby Wallet not detected. Please install Rabby Wallet extension.');
                }

                // Fallback на первый коннектор если ethereum присутствует
                if (!connector && window.ethereum) {
                    connector = connectors[0];
                }
            } else {
                throw new Error('Unsupported wallet type');
            }

            // Финальная проверка - есть ли коннектор
            if (!connector) {
                throw new Error('Wallet connector not found. Please make sure your wallet extension is installed and enabled.');
            }

            // Подключаемся через Wagmi
            const result = await connect(wagmiConfig, { connector });

            // Проверяем аккаунт
            const account = getAccount(wagmiConfig);
            if (!account.address) {
                throw new Error('No account found. Please unlock your wallet.');
            }

            this.account = account.address;
            this.walletType = walletType;

            // Проверяем сеть
            const chainId = getChainId(wagmiConfig);
            if (chainId !== pharosTestnet.id) {
                await this.switchNetwork();
            }

            this.connected = true;
            this.updateConnectionStatus();
            this.hideWalletModal();
            this.showSuccess('Wallet connected successfully!');

            // Обратная совместимость с Web3 (для TournamentManager)
            if (window.ethereum && window.Web3) {
                this.web3 = new window.Web3(window.ethereum);
            } else if (window.ethereum) {
                // Fallback если Web3 не загружен
                this.web3 = { eth: { getChainId: async () => chainId } };
            }

            // Если была попытка начать игру
            if (window.pendingGameStart) {
                window.pendingGameStart = false;
                setTimeout(() => {
                    if (typeof window.startGame === 'function') {
                        window.startGame();
                    }
                }, 1000);
            }

        } catch (error) {
            Logger.error('Connection error:', error);
            this.showError(error.message || 'Connection failed');
        }
    }

    async disconnect() {
        try {
            await disconnect(wagmiConfig);
            this.web3 = null;
            this.contract = null;
            this.account = null;
            this.connected = false;
            this.walletType = null;
            this.updateConnectionStatus();
        } catch (error) {
            Logger.error('Disconnect error:', error);
        }
    }

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

    updateConnectionStatus() {
        const walletButton = document.getElementById('wallet-button');
        const statusElement = document.getElementById('wallet-status');

        if (walletButton && statusElement) {
            if (this.connected && this.account) {
                walletButton.classList.add('connected');
                const shortAddress = `${this.account.slice(0, 6)}...${this.account.slice(-4)}`;
                statusElement.textContent = shortAddress;
            } else {
                walletButton.classList.remove('connected');
                statusElement.textContent = 'Connect Wallet';
            }
        }
    }

    showLoading(message) {
        const messageEl = document.getElementById('wallet-message');
        if (messageEl) {
            messageEl.innerHTML = `<div class="loading-spinner"></div><p>${message}</p>`;
        }
    }

    showError(message) {
        const messageEl = document.getElementById('wallet-message');
        if (messageEl) {
            messageEl.innerHTML = `<div class="error-message">${message}</div>`;
            setTimeout(() => this.clearMessage(), 5000);
        }
    }

    showSuccess(message) {
        const messageEl = document.getElementById('wallet-message');
        if (messageEl) {
            messageEl.innerHTML = `<div class="success-message">${message}</div>`;
            setTimeout(() => this.clearMessage(), 3000);
        }
    }

    clearMessage() {
        const messageEl = document.getElementById('wallet-message');
        if (messageEl) messageEl.innerHTML = '';
    }

    async showGameStartModal() {
        if (!this.connected) {
            this.showWalletModal();
            return false;
        }

        const existingModal = document.querySelector('.wallet-modal');
        if (existingModal) {
            existingModal.remove();
        }

        if (window.confirmGameStart) {
            delete window.confirmGameStart;
        }

        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'wallet-modal';
            modal.style.display = 'flex';
            modal.id = 'game-start-modal';

            modal.innerHTML = `
                <div class="wallet-modal-content" style="text-align: center; padding: 30px;">
                    <h3 style="margin: 0 0 20px 0;">🚀 Start Blockchain Game</h3>
                    <p style="margin: 15px 0; color: #00ddff;">Entry Fee: <strong>${this.config.GAME_FEE} PHRS</strong></p>
                    <p style="font-size: 14px; opacity: 0.8; color: #66ccff; margin-bottom: 20px;">Your score will be recorded on the Pharos blockchain</p>
                    <button onclick="confirmGameStart(true)" style="margin: 10px; padding: 12px 20px; background: #00ddff; color: #001122; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Pay & Start</button>
                    <button onclick="confirmGameStart(false)" style="display: none; margin: 10px; padding: 12px 20px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer;">Play Offline</button>
                </div>
            `;

            document.body.appendChild(modal);

            window.confirmGameStart = (withBlockchain) => {
                const modalToRemove = document.getElementById('game-start-modal');
                if (modalToRemove && modalToRemove.parentNode) {
                    modalToRemove.parentNode.removeChild(modalToRemove);
                }

                const allModals = document.querySelectorAll('.wallet-modal');
                allModals.forEach(modal => {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                });

                delete window.confirmGameStart;
                resolve(withBlockchain);
            };
        });
    }

    async payGameFee() {
        try {
            if (!this.connected) {
                throw new Error('Wallet not connected');
            }

            // 💰 Проверяем баланс через Wagmi
            const balance = await getBalance(wagmiConfig, {
                address: this.account
            });

            const feeInWei = BigInt(parseFloat(this.config.GAME_FEE) * 1e18);

            if (balance.value < feeInWei) {
                throw new Error(`Insufficient balance. You have ${balance.formatted} PHRS, but need ${this.config.GAME_FEE} PHRS`);
            }

            // 📝 Отправляем транзакцию через Wagmi
            const hash = await writeContract(wagmiConfig, {
                address: this.config.CONTRACT_ADDRESS,
                abi: this.contractABI,
                functionName: 'startGame',
                value: feeInWei
            });

            return true;

        } catch (error) {
            Logger.error('❌ Payment error:', error);

            // Обработка ошибки pending транзакции
            if (error.message.includes('already pending') ||
                error.message.includes('still signing') ||
                error.message.includes('Previous transaction')) {
                throw new Error('Previous transaction is still pending. Please cancel it in MetaMask (click pending transaction → Reject), then try again.');
            } else if (error.message.includes('nonce too low')) {
                throw new Error('Transaction nonce error. Reset MetaMask: Settings → Advanced → Clear activity tab data');
            } else if (error.message.includes('insufficient funds') || error.message.includes('Insufficient balance')) {
                throw new Error(error.message || 'Insufficient funds in wallet');
            } else if (error.message.includes('User denied') || error.message.includes('rejected') || error.message.includes('denied transaction')) {
                throw new Error('Transaction cancelled by user');
            } else {
                throw new Error(`Payment failed: ${error.message || 'Unknown error'}`);
            }
        }
    }

    async saveScore(score, playerName) {
        try {
            if (!this.connected) {
                throw new Error('Wallet not connected');
            }

            // 🔒 ВАЛИДАЦИЯ ДАННЫХ
            if (!Number.isInteger(score) || score < 0 || score > 445000) {
                throw new Error('Invalid score value');
            }

            if (!playerName || typeof playerName !== 'string') {
                throw new Error('Player name is required');
            }

            playerName = playerName.trim().replace(/[^a-zA-Z0-9\s]/g, '');

            if (playerName.length < 1 || playerName.length > 20) {
                throw new Error('Player name must be 1-20 characters');
            }

            const suspiciousPatterns = ['script', 'onclick', 'onerror', '<', '>', 'javascript:'];
            const lowerName = playerName.toLowerCase();
            for (let pattern of suspiciousPatterns) {
                if (lowerName.includes(pattern)) {
                    throw new Error('Invalid characters in player name');
                }
            }

            // 📝 Записываем счёт через Wagmi
            const hash = await writeContract(wagmiConfig, {
                address: this.config.CONTRACT_ADDRESS,
                abi: this.contractABI,
                functionName: 'recordScore',
                args: [BigInt(score), playerName]
            });

            return hash;

        } catch (error) {
            Logger.error('❌ Save score error:', error);

            // Обработка ошибки pending транзакции
            if (error.message.includes('already pending') ||
                error.message.includes('still signing') ||
                error.message.includes('Previous transaction')) {
                throw new Error('Previous transaction is still pending. Please cancel it in MetaMask (click pending transaction → Reject), then try again.');
            } else if (error.message.includes('nonce too low')) {
                throw new Error('Transaction nonce error. Reset MetaMask: Settings → Advanced → Clear activity tab data');
            } else if (error.message.includes('User denied') || error.message.includes('rejected') || error.message.includes('denied transaction')) {
                throw new Error('Transaction cancelled by user');
            }

            throw error;
        }
    }

    async getTopScores(limit = 10) {
        try {
            // 📖 Читаем данные через Wagmi
            const scores = await readContract(wagmiConfig, {
                address: this.config.CONTRACT_ADDRESS,
                abi: this.contractABI,
                functionName: 'getTopScores',
                args: [BigInt(limit)]
            });

            return scores.map(score => ({
                player: score.player,
                score: parseInt(score.score.toString()),
                timestamp: parseInt(score.timestamp.toString()),
                playerName: score.playerName
            }));

        } catch (error) {
            Logger.error('❌ Get scores error:', error);
            return [];
        }
    }

    async getBalance() {
        try {
            if (!this.account) {
                return '0';
            }

            // Используем простой eth_getBalance для совместимости
            if (window.ethereum) {
                const balance = await window.ethereum.request({
                    method: 'eth_getBalance',
                    params: [this.account, 'latest']
                });

                // Конвертируем из wei в ether
                const balanceInEther = parseInt(balance, 16) / 1e18;
                return balanceInEther.toFixed(4);
            }

            return '0';
        } catch (error) {
            Logger.error('❌ Get balance error:', error);
            return '0';
        }
    }

    // 🔍 Проверка pending транзакций
    // Эта функция помогает определить, есть ли застрявшие транзакции
    // Если MetaMask показывает ошибку "Previous transaction still signing",
    // пользователь может:
    // 1. Подождать завершения транзакции
    // 2. Отменить её в MetaMask (кнопка "Reject")
    // 3. Сбросить данные активности: Settings → Advanced → Clear activity tab data
    async checkPendingTransactions() {
        try {
            if (!this.account || !window.ethereum) {
                return { hasPending: false, count: 0 };
            }

            // Получаем текущий nonce из сети
            const networkNonce = await window.ethereum.request({
                method: 'eth_getTransactionCount',
                params: [this.account, 'latest']
            });

            // Получаем pending nonce
            const pendingNonce = await window.ethereum.request({
                method: 'eth_getTransactionCount',
                params: [this.account, 'pending']
            });

            // Конвертируем в числа
            const networkNonceNum = parseInt(networkNonce, 16);
            const pendingNonceNum = parseInt(pendingNonce, 16);

            // Проверка на валидность
            if (isNaN(networkNonceNum) || isNaN(pendingNonceNum)) {
                Logger.warn('Invalid nonce values:', { networkNonce, pendingNonce });
                return { hasPending: false, count: 0 };
            }

            // Проверка на разумные значения (защита от бага)
            const count = pendingNonceNum - networkNonceNum;
            if (count < 0 || count > 100) {
                Logger.warn('Suspicious nonce difference:', { networkNonceNum, pendingNonceNum, count });
                return { hasPending: false, count: 0 };
            }

            const hasPending = count > 0;

            Logger.debug('Pending check:', { networkNonceNum, pendingNonceNum, hasPending, count });

            return { hasPending, count, networkNonce: networkNonceNum, pendingNonce: pendingNonceNum };
        } catch (error) {
            Logger.error('Check pending transactions error:', error);
            return { hasPending: false, count: 0 };
        }
    }

    // 🧹 Cleanup при уничтожении
    destroy() {
        if (this.unwatchAccount) {
            this.unwatchAccount();
        }
    }
}

// Создаём глобальный экземпляр
window.walletConnector = new WagmiWalletConnector();

// Инициализируем после загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.walletConnector.init();
    });
} else {
    window.walletConnector.init();
}
