// wallet-connector.js - Модуль для подключения различных кошельков
class WalletConnector {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.account = null;
        this.connected = false;
        this.walletType = null;
        this.hasPaidFee = false;
        
        // Конфигурация блокчейна - берем из GAME_CONFIG если он загружен
        this.config = {
            NETWORK_NAME: 'Pharos Testnet',
            RPC_URL: 'https://testnet.dplabs-internal.com',
            CHAIN_ID: '688688',
            CONTRACT_ADDRESS: '0xaf655fe9fa8cdf421a024509b1cfc15dee89d85e',
            GAME_FEE: this.getGameFee() // Используем функцию для получения комиссии
        };
        
        // ABI контракта (только нужные функции)
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
        
        this.initUI();
    }
    
    // Функция для получения комиссии игры
    getGameFee() {
        // Проверяем, загружен ли GAME_CONFIG
        if (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.GAME_FEE) {
            return GAME_CONFIG.GAME_FEE;
        }
        // Fallback значение если конфиг не загружен
        return '0.001';
    }
    
    // Инициализация UI
    initUI() {
        this.createWalletButton();
        this.createWalletModal();
        this.updateConnectionStatus();
    }
    
    // Создание кнопки подключения кошелька
    createWalletButton() {
        const walletButton = document.createElement('div');
        walletButton.id = 'wallet-button';
        walletButton.className = 'wallet-button';
        walletButton.innerHTML = `
            <button onclick="walletConnector.showWalletModal()">
                <span id="wallet-status">Connect Wallet</span>
            </button>
        `;
        
        // Добавляем стили
        const style = document.createElement('style');
        style.textContent = `
            .wallet-button {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
            }
            
            .wallet-button button {
                background: linear-gradient(135deg, rgba(0, 221, 255, 0.2), rgba(102, 204, 255, 0.3));
                color: #00ddff;
                border: 2px solid #00ddff;
                padding: 12px 20px;
                font-family: 'Arial', sans-serif;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                border-radius: 25px;
                transition: all 0.3s ease;
                box-shadow: 0 0 20px rgba(0, 221, 255, 0.4);
                backdrop-filter: blur(10px);
            }
            
            .wallet-button button:hover {
                background: linear-gradient(135deg, rgba(0, 221, 255, 0.4), rgba(102, 204, 255, 0.5));
                box-shadow: 0 0 30px rgba(0, 221, 255, 0.8);
                transform: translateY(-2px);
            }
            
            .wallet-button.connected button {
                background: linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(102, 255, 179, 0.3));
                border-color: #00ff88;
                color: #00ff88;
                box-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
            }
            
            .wallet-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 2000;
                backdrop-filter: blur(5px);
            }
            
            .wallet-modal-content {
                background: linear-gradient(135deg, 
                    rgba(0, 17, 34, 0.95) 0%, 
                    rgba(0, 51, 102, 0.9) 100%);
                padding: 30px;
                border-radius: 20px;
                border: 2px solid #00ddff;
                box-shadow: 0 0 50px rgba(0, 221, 255, 0.8);
                max-width: 400px;
                width: 90%;
                text-align: center;
                color: #00ddff;
            }
            
            .wallet-modal h3 {
                margin-bottom: 25px;
                font-size: 24px;
                color: #00ddff;
            }
            
            .wallet-option {
                display: flex;
                align-items: center;
                padding: 15px;
                margin: 10px 0;
                border: 1px solid rgba(0, 221, 255, 0.3);
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
                background: rgba(0, 221, 255, 0.05);
            }
            
            .wallet-option:hover {
                background: rgba(0, 221, 255, 0.15);
                border-color: #00ddff;
                transform: translateX(5px);
            }
            
            .wallet-option img {
                width: 32px;
                height: 32px;
                margin-right: 15px;
                border-radius: 6px;
            }
            
            .wallet-option span {
                font-size: 16px;
                font-weight: bold;
            }
            
            .wallet-option.disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .wallet-option.disabled:hover {
                transform: none;
                background: rgba(0, 221, 255, 0.05);
            }
            
            .close-modal {
                position: absolute;
                top: 15px;
                right: 20px;
                background: none;
                border: none;
                color: #00ddff;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
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
                margin: 15px 0;
                font-size: 14px;
            }
            
            .success-message {
                background: rgba(0, 255, 136, 0.2);
                border: 1px solid #00ff88;
                color: #00ff88;
                padding: 10px;
                border-radius: 8px;
                margin: 15px 0;
                font-size: 14px;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(walletButton);
    }
    
    // Создание модального окна выбора кошелька
    createWalletModal() {
        const modal = document.createElement('div');
        modal.id = 'wallet-modal';
        modal.className = 'wallet-modal';
        modal.innerHTML = `
            <div class="wallet-modal-content">
                <button class="close-modal" onclick="walletConnector.hideWalletModal()">×</button>
                <h3>Connect Your Wallet</h3>
                <div id="wallet-message"></div>
                
                <div class="wallet-option" onclick="walletConnector.connectWallet('metamask')">
                    <img src="data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30.04 3.484l-12.364 9.09 2.292-5.388z' fill='%23e2761b'/%3E%3Cpath d='M1.96 3.484l12.265 9.16-2.193-5.458z' fill='%23e4761b'/%3E%3Cpath d='M25.707 23.242l-3.294 5.01 7.049 1.94 2.022-6.82z' fill='%23e4761b'/%3E%3Cpath d='M.475 23.372l2.023 6.82 7.048-1.94-3.293-5.01z' fill='%23e4761b'/%3E%3Cpath d='M9.29 14.24l-1.962 2.952 6.995.317-.24-7.491z' fill='%23e4761b'/%3E%3Cpath d='M22.71 14.24l-4.854-4.293-.159 7.564 6.995-.317z' fill='%23e4761b'/%3E%3Cpath d='M9.546 28.252l4.204-2.03-3.615-2.818z' fill='%23e4761b'/%3E%3Cpath d='M18.25 26.222l4.205 2.03-.59-4.848z' fill='%23e4761b'/%3E%3C/svg%3E" alt="MetaMask">
                    <span>MetaMask</span>
                </div>
                
                <div class="wallet-option" onclick="walletConnector.connectWallet('okx')">
                    <img src="data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16-7.163 16-16 16z' fill='%23000'/%3E%3Cpath d='M8 8h6v6H8zm10 0h6v6h-6zM8 18h6v6H8zm10 0h6v6h-6z' fill='%23fff'/%3E%3C/svg%3E" alt="OKX">
                    <span>OKX Wallet</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Показать модальное окно
    showWalletModal() {
        if (this.connected) {
            this.disconnect();
        } else {
            document.getElementById('wallet-modal').style.display = 'flex';
        }
    }
    
    // Скрыть модальное окно
    hideWalletModal() {
        const modal = document.getElementById('wallet-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.clearMessage();
        
        // Если было ожидание начала игры и пользователь закрыл модал, просто очищаем флаг
        if (window.pendingGameStart) {
            window.pendingGameStart = false;
        }
    }
    
    // Подключение к кошельку
    async connectWallet(walletType) {
        try {
            this.showLoading('Connecting...');
            
            let provider = null;
            
            switch (walletType) {
                case 'metamask':
                    if (typeof window.ethereum !== 'undefined') {
                        // Проверяем, что это именно MetaMask
                        if (window.ethereum.isMetaMask) {
                            provider = window.ethereum;
                        } else {
                            throw new Error('MetaMask not detected. Please install MetaMask extension.');
                        }
                    } else {
                        throw new Error('No Ethereum wallet detected. Please install MetaMask.');
                    }
                    break;
                    
                case 'okx':
                    if (typeof window.okexchain !== 'undefined') {
                        provider = window.okexchain;
                    } else if (typeof window.ethereum !== 'undefined' && window.ethereum.isOkxWallet) {
                        provider = window.ethereum;
                    } else {
                        throw new Error('OKX Wallet not detected. Please install OKX Wallet extension.');
                    }
                    break;
                    
                default:
                    throw new Error('Unsupported wallet type');
            }
            
            // Инициализация Web3
            this.web3 = new Web3(provider);
            
            // Запрос доступа к аккаунтам
            const accounts = await provider.request({
                method: 'eth_requestAccounts'
            });
            
            if (accounts.length === 0) {
                throw new Error('No accounts found. Please unlock your wallet.');
            }
            
            this.account = accounts[0];
            this.walletType = walletType;
            
            // Проверка сети
            const chainId = await this.web3.eth.getChainId();
            if (chainId.toString() !== this.config.CHAIN_ID) {
                await this.switchNetwork();
            }
            
            // Инициализация контракта
            this.contract = new this.web3.eth.Contract(this.contractABI, this.config.CONTRACT_ADDRESS);
            
            this.connected = true;
            this.updateConnectionStatus();
            this.hideWalletModal();
            this.showSuccess('Wallet connected successfully!');
            
            // Настройка слушателей событий
            this.setupEventListeners();
            
            // Если пользователь нажал START BATTLE и подключил кошелек, продолжаем игру
            if (window.pendingGameStart) {
                window.pendingGameStart = false;
                setTimeout(() => {
                    if (typeof window.startGame === 'function') {
                        window.startGame();
                    }
                }, 1000); // Небольшая задержка для показа сообщения об успехе
            }
            
        } catch (error) {
            console.error('Connection error:', error);
            this.showError(error.message);
        }
    }
    
    // Отключение кошелька
    disconnect() {
        this.web3 = null;
        this.contract = null;
        this.account = null;
        this.connected = false;
        this.walletType = null;
        this.hasPaidFee = false;
        this.updateConnectionStatus();
    }
    
    // Переключение сети
    async switchNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${parseInt(this.config.CHAIN_ID).toString(16)}` }]
            });
        } catch (switchError) {
            // Если сеть не добавлена, пытаемся добавить
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: `0x${parseInt(this.config.CHAIN_ID).toString(16)}`,
                            chainName: this.config.NETWORK_NAME,
                            rpcUrls: [this.config.RPC_URL],
                            nativeCurrency: {
                                name: 'PHRS',
                                symbol: 'PHRS',
                                decimals: 18
                            }
                        }]
                    });
                } catch (addError) {
                    throw new Error('Failed to add Pharos network');
                }
            } else {
                throw switchError;
            }
        }
    }
    
    // Настройка слушателей событий
    setupEventListeners() {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else {
                    this.account = accounts[0];
                    this.updateConnectionStatus();
                }
            });
            
            window.ethereum.on('chainChanged', (chainId) => {
                if (parseInt(chainId, 16).toString() !== this.config.CHAIN_ID) {
                    this.showError('Please switch to Pharos Testnet');
                }
            });
        }
    }
    
    // Обновление статуса подключения
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
    
    // Отображение сообщений
    showLoading(message) {
        const messageEl = document.getElementById('wallet-message');
        if (messageEl) {
            messageEl.innerHTML = `
                <div class="loading-spinner"></div>
                <p>${message}</p>
            `;
        }
    }
    
    showError(message) {
        const messageEl = document.getElementById('wallet-message');
        if (messageEl) {
            messageEl.innerHTML = `
                <div class="error-message">${message}</div>
            `;
            setTimeout(() => this.clearMessage(), 5000);
        }
    }
    
    showSuccess(message) {
        const messageEl = document.getElementById('wallet-message');
        if (messageEl) {
            messageEl.innerHTML = `
                <div class="success-message">${message}</div>
            `;
            setTimeout(() => this.clearMessage(), 3000);
        }
    }
    
    clearMessage() {
        const messageEl = document.getElementById('wallet-message');
        if (messageEl) {
            messageEl.innerHTML = '';
        }
    }
    
    // Платежные функции для игры
    async showGameStartModal() {
        if (!this.connected) {
            this.showWalletModal();
            return false;
        }
        
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'wallet-modal';
            modal.style.display = 'flex';
            
            // Получаем актуальную комиссию из GAME_CONFIG
            const currentFee = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.GAME_FEE) 
                ? GAME_CONFIG.GAME_FEE 
                : this.getGameFee();
            
            console.log('🎮 Current game fee from config:', currentFee); // Для отладки
            
            modal.innerHTML = `
                <div class="wallet-modal-content">
                    <h3>🚀 Start Blockchain Game</h3>
                    <p style="margin: 15px 0;">Entry Fee: <strong>${currentFee} PHRS</strong></p>
                    <p style="font-size: 14px; opacity: 0.8;">Your score will be recorded on the Pharos blockchain</p>
                    <button onclick="confirmGameStart(true)" style="margin: 10px; padding: 12px 20px; background: #00ddff; color: #001122; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Pay & Start</button>
                    <button onclick="confirmGameStart(false)" style="margin: 10px; padding: 12px 20px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer;">Play Offline</button>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            window.confirmGameStart = (withBlockchain) => {
                document.body.removeChild(modal);
                delete window.confirmGameStart;
                resolve(withBlockchain);
            };
        });
    }
    
    async payGameFee() {
        try {
            if (!this.connected || !this.contract) {
                throw new Error('Wallet not connected');
            }
            
            // Получаем актуальную комиссию из GAME_CONFIG
            const currentFee = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.GAME_FEE) 
                ? GAME_CONFIG.GAME_FEE 
                : this.getGameFee();
            
            console.log('💰 Trying to pay game fee:', currentFee, 'PHRS');
            
            const feeInWei = this.web3.utils.toWei(currentFee, 'ether');
            console.log('💰 Fee in Wei:', feeInWei);
            
            // Проверим баланс пользователя
            const balance = await this.web3.eth.getBalance(this.account);
            const balanceInEther = this.web3.utils.fromWei(balance, 'ether');
            console.log('💳 User balance:', balanceInEther, 'PHRS');
            
            if (parseFloat(balanceInEther) < parseFloat(currentFee)) {
                throw new Error(`Insufficient balance. You have ${balanceInEther} PHRS, but need ${currentFee} PHRS`);
            }
            
            const gasEstimate = await this.contract.methods.startGame().estimateGas({
                from: this.account,
                value: feeInWei
            });
            
            console.log('⛽ Estimated gas:', gasEstimate);

            const tx = await this.contract.methods.startGame().send({
                from: this.account,
                value: feeInWei,
                gas: Math.round(gasEstimate * 1.2)
            });

            this.hasPaidFee = true;
            console.log('✅ Game fee paid successfully! TX:', tx.transactionHash);
            return true;
            
        } catch (error) {
            console.error('❌ Payment error details:', error);
            
            // Улучшенная обработка ошибок
            if (error.message.includes('Insufficient fee') || error.message.includes('insufficient fee')) {
                throw new Error(`Fee too low! Contract requires more than ${currentFee} PHRS. Try increasing GAME_FEE in game-config.js`);
            } else if (error.message.includes('insufficient funds') || error.message.includes('Insufficient balance')) {
                throw new Error(error.message || 'Insufficient funds in wallet');
            } else if (error.message.includes('User denied') || error.message.includes('rejected')) {
                throw new Error('Transaction cancelled by user');
            } else if (error.message.includes('gas')) {
                throw new Error('Transaction failed due to gas issues. Please try again.');
            } else if (error.message.includes('network')) {
                throw new Error('Network error. Please check your connection and try again.');
            } else {
                throw new Error(`Payment failed: ${error.message || 'Unknown error'}`);
            }
        }
    }
    
    async saveScore(score, playerName) {
        try {
            if (!this.connected || !this.contract) {
                throw new Error('Wallet not connected');
            }
            
            if (!this.hasPaidFee) {
                throw new Error('Game fee not paid');
            }
            
            const gasEstimate = await this.contract.methods
                .recordScore(score, playerName)
                .estimateGas({ from: this.account });

            const tx = await this.contract.methods
                .recordScore(score, playerName)
                .send({
                    from: this.account,
                    gas: Math.round(gasEstimate * 1.2)
                });

            console.log('Score saved, tx:', tx.transactionHash);
            return tx.transactionHash;
            
        } catch (error) {
            console.error('Save score error:', error);
            throw error;
        }
    }
    
    async getTopScores(limit = 10) {
        try {
            if (!this.contract) {
                return [];
            }
            
            const scores = await this.contract.methods.getTopScores(limit).call();
            return scores.map(score => ({
                player: score.player,
                score: parseInt(score.score),
                timestamp: parseInt(score.timestamp),
                playerName: score.playerName
            }));
            
        } catch (error) {
            console.error('Get top scores error:', error);
            return [];
        }
    }
}

// Создание глобального экземпляра
window.walletConnector = new WalletConnector();
