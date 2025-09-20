class WalletConnector {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.account = null;
        this.connected = false;
        this.walletType = null;
        this.isInitialized = false;
        
        this.config = {
            NETWORK_NAME: 'Pharos Testnet',
            RPC_URL: 'https://testnet.dplabs-internal.com',
            CHAIN_ID: '688688',
            CONTRACT_ADDRESS: '0xaf655fe9fa8cdf421a024509b1cfc15dee89d85e', // game contract (single player)
            GAME_FEE: '0.001'
        };
        
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
        this.updateConnectionStatus();
        this.isInitialized = true;
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
                background: linear-gradient(135deg, rgba(0, 17, 34, 0.95) 0%, rgba(0, 51, 102, 0.9) 100%);
                padding: 30px;
                border-radius: 20px;
                border: 2px solid #00ddff;
                box-shadow: 0 0 50px rgba(0, 221, 255, 0.8);
                max-width: 400px;
                width: 90%;
                text-align: center;
                color: #00ddff;
                position: relative;
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
        
        // УДАЛЕНО: Дублированная кнопка кошелька из wallet-connector.js
        // Используем только кнопку из tournament-lobby.html
    }
    
    createWalletModal() {
        if (document.getElementById('wallet-modal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'wallet-modal';
        modal.className = 'wallet-modal';
        modal.innerHTML = `
            <div class="wallet-modal-content">
                <button class="close-modal" onclick="walletConnector.hideWalletModal()">×</button>
                <h3>Connect Your Wallet</h3>
                <div id="wallet-message" class="wallet-message"></div>
                
                <div class="wallet-option" onclick="walletConnector.connectWallet('metamask')">
                    <img src="https://raw.githubusercontent.com/vi11abajo/PoA/main/images/mmicon.png" alt="MetaMask">
                    <span>MetaMask</span>
                </div>
                
                <div class="wallet-option" onclick="walletConnector.connectWallet('okx')">
                    <img src="https://raw.githubusercontent.com/vi11abajo/PoA/main/images/okxicon.png" alt="OKX">
                    <span>OKX Wallet</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    showWalletModal() {
        if (this.connected) {
            this.disconnect();
        } else {
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
            
            let provider = null;
            
            if (walletType === 'metamask') {
                if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
                    provider = window.ethereum;
                } else {
                    throw new Error('MetaMask not detected. Please install MetaMask extension.');
                }
            } else if (walletType === 'okx') {
                if (typeof window.okexchain !== 'undefined') {
                    provider = window.okexchain;
                } else if (typeof window.ethereum !== 'undefined' && window.ethereum.isOkxWallet) {
                    provider = window.ethereum;
                } else {
                    throw new Error('OKX Wallet not detected. Please install OKX Wallet extension.');
                }
            } else {
                throw new Error('Unsupported wallet type');
            }
            
            this.web3 = new Web3(provider);
            
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found. Please unlock your wallet.');
            }
            
            this.account = accounts[0];
            this.walletType = walletType;
            
            
            const chainId = await this.web3.eth.getChainId();
            if (chainId.toString() !== this.config.CHAIN_ID) {
                await this.switchNetwork();
            }
            
            
            this.contract = new this.web3.eth.Contract(this.contractABI, this.config.CONTRACT_ADDRESS);
            
            this.connected = true;
            this.updateConnectionStatus();
            this.hideWalletModal();
            this.showSuccess('Wallet connected successfully!');
            
            
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
            this.showError(error.message);
        }
    }
    
    disconnect() {
        this.web3 = null;
        this.contract = null;
        this.account = null;
        this.connected = false;
        this.walletType = null;
        this.updateConnectionStatus();
    }
    
    async switchNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${parseInt(this.config.CHAIN_ID).toString(16)}` }]
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: `0x${parseInt(this.config.CHAIN_ID).toString(16)}`,
                        chainName: this.config.NETWORK_NAME,
                        rpcUrls: [this.config.RPC_URL],
                        nativeCurrency: { name: 'PHRS', symbol: 'PHRS', decimals: 18 }
                    }]
                });
            } else {
                throw switchError;
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
        
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'wallet-modal';
            modal.style.display = 'flex';
            
            modal.innerHTML = `
                <div class="wallet-modal-content">
                    <h3>🚀 Start Blockchain Game</h3>
                    <p style="margin: 15px 0;">Entry Fee: <strong>${this.config.GAME_FEE} PHRS</strong></p>
                    <p style="font-size: 14px; opacity: 0.8;">Your score will be recorded on the Pharos blockchain</p>
                    <button onclick="confirmGameStart(true)" style="margin: 10px; padding: 12px 20px; background: #00ddff; color: #001122; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Pay & Start</button>
                    <button onclick="confirmGameStart(false)" style="display: none; margin: 10px; padding: 12px 20px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer;">Play Offline</button>
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
            
            
            const feeInWei = this.web3.utils.toWei(this.config.GAME_FEE, 'ether');
            
            const balance = await this.web3.eth.getBalance(this.account);
            const balanceInEther = this.web3.utils.fromWei(balance, 'ether');
            
            if (parseFloat(balanceInEther) < parseFloat(this.config.GAME_FEE)) {
                throw new Error(`Insufficient balance. You have ${balanceInEther} PHRS, but need ${this.config.GAME_FEE} PHRS`);
            }
            
            const gasEstimate = await this.contract.methods.startGame().estimateGas({
                from: this.account,
                value: feeInWei
            });

            const tx = await this.contract.methods.startGame().send({
                from: this.account,
                value: feeInWei,
                gas: Math.round(gasEstimate * 1.2)
            });

            return true;
            
        } catch (error) {
            Logger.error('❌ Payment error:', error);
            
            if (error.message.includes('insufficient funds') || error.message.includes('Insufficient balance')) {
                throw new Error(error.message || 'Insufficient funds in wallet');
            } else if (error.message.includes('User denied') || error.message.includes('rejected')) {
                throw new Error('Transaction cancelled by user');
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
            
            // 🔒 ВАЛИДАЦИЯ ДАННЫХ
            // Проверка счёта
            if (!Number.isInteger(score) || score < 0 || score > 445000) {
                throw new Error('Invalid score value');
            }
            
            // Проверка имени
            if (!playerName || typeof playerName !== 'string') {
                throw new Error('Player name is required');
            }
            
            // Санитизация имени - только буквы, цифры и пробелы
            playerName = playerName.trim().replace(/[^a-zA-Z0-9\s]/g, '');
            
            if (playerName.length < 1 || playerName.length > 20) {
                throw new Error('Player name must be 1-20 characters');
            }
            
            // Проверка на подозрительные паттерны в имени
            const suspiciousPatterns = ['script', 'onclick', 'onerror', '<', '>', 'javascript:'];
            const lowerName = playerName.toLowerCase();
            for (let pattern of suspiciousPatterns) {
                if (lowerName.includes(pattern)) {
                    throw new Error('Invalid characters in player name');
                }
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

            return tx.transactionHash;
            
        } catch (error) {
            Logger.error('❌ Save score error:', error);
            throw error;
        }
    }
    
    async getTopScores(limit = 10) {
        try {
            if (!this.contract) return [];
            
            const scores = await this.contract.methods.getTopScores(limit).call();
            return scores.map(score => ({
                player: score.player,
                score: parseInt(score.score),
                timestamp: parseInt(score.timestamp),
                playerName: score.playerName
            }));
            
        } catch (error) {
            Logger.error('❌ Get scores error:', error);
            return [];
        }
    }
}


window.walletConnector = new WalletConnector();

// Инициализируем кошелек после загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.walletConnector.init();
    });
} else {
    window.walletConnector.init();
}