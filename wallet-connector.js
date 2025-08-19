// wallet-connector.js - Модуль для подключения различных кошельков
class WalletConnector {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.account = null;
        this.connected = false;
        this.walletType = null;
        this.hasPaidFee = false;
        this.isInitialized = false;
        
        // Конфигурация блокчейна
        this.config = {
            NETWORK_NAME: 'Pharos Testnet',
            RPC_URL: 'https://testnet.dplabs-internal.com',
            CHAIN_ID: '688688',
            CONTRACT_ADDRESS: '0xaf655fe9fa8cdf421a024509b1cfc15dee89d85e',
            GAME_FEE: this.getGameFee()
        };
        
        // ABI контракта
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
        
        console.log('🔄 Creating WalletConnector...');
        this.initUI();
        this.initAsync();
    }
    
    getGameFee() {
        if (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.GAME_FEE) {
            return GAME_CONFIG.GAME_FEE;
        }
        return '0.001';
    }
    
    async initAsync() {
        try {
            console.log('🔄 Starting wallet connector async initialization...');
            await this.restoreConnectionFromStorage();
            this.isInitialized = true;
            console.log('✅ WalletConnector initialized, connected:', this.connected);
        } catch (error) {
            console.error('❌ Failed to initialize wallet connector:', error);
            this.isInitialized = true;
        }
    }
    
    initUI() {
        this.createWalletButton();
        this.createWalletModal();
        this.updateConnectionStatus();
    }
    
    createWalletButton() {
        if (document.getElementById('wallet-button')) {
            console.log('Wallet button already exists');
            return;
        }
        
        console.log('Creating wallet button...');
        
        const walletButton = document.createElement('div');
        walletButton.id = 'wallet-button';
        walletButton.className = 'wallet-button';
        walletButton.innerHTML = `
            <button onclick="walletConnector.showWalletModal()">
                <span id="wallet-status">Connect Wallet</span>
            </button>
        `;
        
        if (!document.getElementById('wallet-styles')) {
            const style = document.createElement('style');
            style.id = 'wallet-styles';
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
        }
        
        document.body.appendChild(walletButton);
        console.log('✅ Wallet button created successfully');
    }
    
    createWalletModal() {
        if (document.getElementById('wallet-modal')) {
            console.log('Wallet modal already exists');
            return;
        }
        
        console.log('Creating wallet modal...');
        
        const modal = document.createElement('div');
        modal.id = 'wallet-modal';
        modal.className = 'wallet-modal';
        modal.innerHTML = `
            <div class="wallet-modal-content">
                <button class="close-modal" onclick="walletConnector.hideWalletModal()">×</button>
                <h3>Connect Your Wallet</h3>
                <div id="wallet-message"></div>
                
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
        console.log('✅ Wallet modal created successfully');
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
        if (modal) {
            modal.style.display = 'none';
        }
        this.clearMessage();
        
        if (window.pendingGameStart) {
            window.pendingGameStart = false;
        }
    }
    
    async connectWallet(walletType, silentRestore = false) {
        try {
            if (!silentRestore) {
                this.showLoading('Connecting...');
            }
            
            let provider = null;
            
            switch (walletType) {
                case 'metamask':
                    if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
                        provider = window.ethereum;
                    } else {
                        throw new Error('MetaMask not detected. Please install MetaMask extension.');
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
            
            this.web3 = new Web3(provider);
            
            let accounts;
            if (silentRestore) {
                try {
                    accounts = await provider.request({ method: 'eth_accounts' });
                } catch (error) {
                    console.log('Failed to get accounts silently:', error);
                    return false;
                }
            } else {
                accounts = await provider.request({ method: 'eth_requestAccounts' });
            }
            
            if (!accounts || accounts.length === 0) {
                if (silentRestore) {
                    console.log('No accounts available for silent restore');
                    return false;
                } else {
                    throw new Error('No accounts found. Please unlock your wallet.');
                }
            }
            
            this.account = accounts[0];
            this.walletType = walletType;
            
            try {
                const chainId = await this.web3.eth.getChainId();
                if (chainId.toString() !== this.config.CHAIN_ID) {
                    if (!silentRestore) {
                        await this.switchNetwork();
                    }
                }
            } catch (error) {
                console.log('Network check failed:', error);
                if (!silentRestore) {
                    throw error;
                }
            }
            
            try {
                this.contract = new this.web3.eth.Contract(this.contractABI, this.config.CONTRACT_ADDRESS);
            } catch (error) {
                console.log('Contract initialization failed:', error);
                if (!silentRestore) {
                    throw error;
                }
            }
            
            this.connected = true;
            this.updateConnectionStatus();
            
            if (!silentRestore) {
                this.hideWalletModal();
                this.showSuccess('Wallet connected successfully!');
            }
            
            this.saveConnectionToStorage();
            this.setupEventListeners();
            
            if (window.pendingGameStart && !silentRestore) {
                window.pendingGameStart = false;
                setTimeout(() => {
                    if (typeof window.startGame === 'function') {
                        window.startGame();
                    }
                }, 1000);
            }
            
            console.log('✅ Wallet connected:', this.account);
            return true;
            
        } catch (error) {
            console.error('Connection error:', error);
            if (!silentRestore) {
                this.showError(error.message);
            }
            return false;
        }
    }
    
    disconnect() {
        this.web3 = null;
        this.contract = null;
        this.account = null;
        this.connected = false;
        this.walletType = null;
        this.hasPaidFee = false;
        this.clearConnectionFromStorage();
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
    
    setupEventListeners() {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else {
                    this.account = accounts[0];
                    this.updateConnectionStatus();
                    this.saveConnectionToStorage();
                }
            });
            
            window.ethereum.on('chainChanged', (chainId) => {
                if (parseInt(chainId, 16).toString() !== this.config.CHAIN_ID) {
                    this.showError('Please switch to Pharos Testnet');
                }
            });
            
            window.ethereum.on('disconnect', () => {
                console.log('Wallet disconnected');
                this.disconnect();
            });
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
    
    saveConnectionToStorage() {
        try {
            if (this.connected && this.account && this.walletType) {
                const connectionData = {
                    account: this.account,
                    walletType: this.walletType,
                    connected: true,
                    timestamp: Date.now()
                };
                localStorage.setItem('pharos_wallet_connected', JSON.stringify(connectionData));
                console.log('💾 Connection saved to localStorage');
            }
        } catch (error) {
            console.error('Failed to save connection:', error);
        }
    }
    
    async restoreConnectionFromStorage() {
        try {
            const savedConnection = localStorage.getItem('pharos_wallet_connected');
            if (!savedConnection) {
                console.log('🔍 No saved connection found');
                return false;
            }
            
            const connectionData = JSON.parse(savedConnection);
            
            const weekInMs = 7 * 24 * 60 * 60 * 1000;
            if (connectionData.timestamp && (Date.now() - connectionData.timestamp > weekInMs)) {
                console.log('🕐 Saved connection expired');
                this.clearConnectionFromStorage();
                return false;
            }
            
            if (connectionData.connected && connectionData.account && connectionData.walletType) {
                console.log('🔄 Found saved connection for:', connectionData.walletType);
                
                const hasWallet = (connectionData.walletType === 'metamask' && typeof window.ethereum !== 'undefined') ||
                                 (connectionData.walletType === 'okx' && (typeof window.okexchain !== 'undefined' || (window.ethereum && window.ethereum.isOkxWallet)));
                
                if (hasWallet) {
                    console.log('🔄 Attempting to restore wallet connection...');
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    const restored = await this.connectWallet(connectionData.walletType, true);
                    if (restored) {
                        console.log('✅ Wallet connection restored successfully');
                        return true;
                    } else {
                        console.log('❌ Failed to restore wallet connection');
                    }
                } else {
                    console.log('🔍 Wallet extension not available');
                }
            }
        } catch (error) {
            console.log('❌ Failed to restore wallet connection:', error);
        }
        return false;
    }
    
    clearConnectionFromStorage() {
        try {
            localStorage.removeItem('pharos_wallet_connected');
            console.log('🗑️ Connection data cleared from localStorage');
        } catch (error) {
            console.error('Failed to clear connection data:', error);
        }
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
            
            const currentFee = '0.001';
            
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
            
            const currentFee = '0.001';
            console.log('💰 Trying to pay game fee:', currentFee, 'PHRS');
            
            const feeInWei = this.web3.utils.toWei(currentFee, 'ether');
            console.log('💰 Fee in Wei:', feeInWei);
            
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

            console.log('✅ Game fee paid successfully! TX:', tx.transactionHash);
            return true;
            
        } catch (error) {
            console.error('❌ Payment error details:', error);
            
            if (error.message.includes('Insufficient fee') || error.message.includes('insufficient fee')) {
                throw new Error(`Fee too low! Contract requires more than ${currentFee} PHRS.`);
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
